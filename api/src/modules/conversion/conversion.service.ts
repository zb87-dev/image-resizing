import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { SQSService } from './sqs.service';
import { AppConfigService } from '../../config/app-config.service';
import { UserService } from '../user/user.service';
import * as Multer from 'multer';
import { UploadService } from './upload.service';
import {
  ConversionRequestRepository,
  ConversionRequestWithStatus,
} from './repository/conversionRequest.repository';
import { ConversionTaskRepository } from './repository/conversionTask.repository';
import { ConversionRequest } from './entities/conversionRequest.entity';

interface ConversionUpdate {
  target: 'server' | 'worker';
  userId: string;
  requestId: string;
  taskId: string;
  fileName: string;
  resolution: string;
  filePath: string;
  mimeType: string;
  convertedFilePath: string;
  status: string;
}

@Injectable()
export class ConversionService implements OnModuleInit {
  constructor(
    private readonly appConfig: AppConfigService,
    private readonly sqsService: SQSService,
    private readonly logger: Logger,
    private readonly userService: UserService,
    private readonly uploadService: UploadService,
    private readonly conversionRequestRepository: ConversionRequestRepository,
    private readonly conversionTaskRepository: ConversionTaskRepository,
  ) {}

  onModuleInit() {
    this.startListeningForMessages();
  }

  public async create(userId: string, files: Multer.File[]): Promise<any> {
    try {
      const uploadResult = {
        success: [],
        error: [],
      };

      const conversionRequests = [];

      const user = await this.userService.getUserById(userId);

      // Upload images in parallel
      const uploadPromises = files.map(async (file) => {
        try {
          const conversionRequest = this.createConversionRequest(user.id, file);
          conversionRequests.push(conversionRequest);
          await this.uploadFileToS3(conversionRequest.filePath, file);
          uploadResult.success.push(conversionRequest);
        } catch (error) {
          this.logger.error(`Failed to upload files for user ${userId}`, error.stack);
          uploadResult.error.push({ file: file.filename, error: error.message });
        }
      });

      // Upload images in parallel
      await Promise.all(uploadPromises);

      // Save bulk data
      await this.conversionRequestRepository.save(conversionRequests);

      return uploadResult;
    } catch (error) {
      this.logger.error(`Failed to upload files for user ${userId}`, error.stack);
      throw new InternalServerErrorException(`Failed to create coversion request`);
    }
  }

  public async startConversion(userId: string, conversionId: string, resolutions: string[]) {
    // Get conversion request
    const conversion = await this.conversionRequestRepository.getUserRequestById(
      userId,
      conversionId,
    );
    if (!conversion) {
      throw new BadRequestException(`Conversion request not found`);
    }

    // Set it's status to processing
    conversion.status = 'processing';
    conversion.resolutions = JSON.stringify(resolutions);
    await this.conversionRequestRepository.save(conversion);

    const messages = [];
    // Create separate tasks for each resolution
    const tasks = resolutions.map((resolution) => {
      const task = this.createConversionTask(userId, conversionId, resolution);
      const message = {
        target: 'worker',
        userId: userId,
        requestId: conversion.id,
        taskId: task.id,
        fileName: conversion.fileName,
        resolution: resolution,
        filePath: conversion.filePath,
        mimeType: conversion.fileType,
      };
      messages.push(message);
      return task;
    });

    await this.conversionTaskRepository.save(tasks);

    // Inform worker using SQS to start conversion
    // TODO: Optimize it to send messages in bulk
    for (var message of messages) {
      // Make small delay to avoid throttling
      await new Promise((resolve) => setTimeout(resolve, 100));
      await this.sendMessageToWorker(message);
    }

    return conversion;
  }

  private groupRequestsAndTasks(data: ConversionRequestWithStatus[]) {
    const groupedTasks = data.reduce((acc, curr) => {
      // Check if the current task's id is already in the accumulator
      let request = acc.find((task) => task.id === curr.id);

      // If the task is not found, create a new entry
      if (!request) {
        request = {
          id: curr.id,
          createdAt: curr.createdAt,
          fileName: curr.fileName,
          fileSize: curr.fileSize,
          fileType: curr.fileType,
          status: curr.status,
          resolutions: curr.resolutions,
          tasks: [],
        };
        acc.push(request);
      }

      if (curr.convertedFilePath) {
        // Add the current task detail to the tasks array
        request.tasks.push({
          taskRequestId: curr.taskRequestId,
          taskId: curr.taskId,
          resolution: curr.resolution,
          taskStatus: curr.taskStatus,
          convertedFilePath: this.getPublicUrl(curr.convertedFilePath),
          taskCreatedAt: curr.taskCreatedAt,
          taskUpdatedAt: curr.taskUpdatedAt,
        });
      }

      return acc;
    }, []);

    return groupedTasks;
  }

  public async getConversionRequests(userId: string) {
    const data =
      await this.conversionRequestRepository.getConversionRequestsDetailsByUserId(userId);

    return this.groupRequestsAndTasks(data);
  }

  private getPublicUrl(key: string) {
    if (!key) {
      return null;
    }

    const bucketName = this.appConfig.getConfig().aws.bucketName;
    return this.uploadService.generatePresignedUrl(bucketName, key, 60);
  }

  private async startListeningForMessages() {
    while (true) {
      const queueUrl = this.appConfig.getConfig().aws.sqsUrlServer;
      const data = await this.sqsService.receiveMessage(queueUrl);
      if (!data) {
        continue;
      }

      for (const message of data.Messages) {
        if (!message) {
          continue;
        }
        const receiptHandle = message.ReceiptHandle;
        const body = message.Body;
        if (!body) {
          continue;
        }

        try {
          const data = JSON.parse(body);

          if (data.message && data.message.target === 'server') {
            const message: ConversionUpdate = data.message;

            await this.sqsService.deleteMessage(queueUrl, receiptHandle);

            const task = await this.conversionTaskRepository.getTaskById(message.taskId);
            task.convertedFilePath = message.convertedFilePath;
            task.status = message.status;
            await this.conversionTaskRepository.save(task);
          }

          // Process the message
        } catch (error) {
          this.logger.error('Failed to parse message body', error.stack);
        }
      }
    }
  }

  private createConversionRequest(userId: string, file: Multer.File): ConversionRequest {
    const conversionRequestId = uuidv4();
    const s3Path = `users/${userId}/${conversionRequestId}/${file.originalname}`;
    const request = {
      id: conversionRequestId,
      userId: userId,
      fileName: file.originalname,
      fileSize: file.size,
      fileType: file.mimetype,
      filePath: `${s3Path}`,
      status: 'pending',
      resolutions: '[]',
    };

    return request;
  }

  private createConversionTask(userId: string, requestId: string, resolution: string) {
    const conversionTaskId = uuidv4();
    return {
      id: conversionTaskId,
      userId: userId,
      requestId: requestId,
      resolution,
      status: 'pending',
    };
  }

  private async uploadFileToS3(path: string, file: Multer.File): Promise<string> {
    return this.uploadService.uploadFilesToS3(path, file);
  }

  private async sendMessageToWorker(data: unknown): Promise<void> {
    const queueUrl = this.appConfig.getConfig().aws.sqsUrlWorker;
    await this.sqsService.sendMessage(queueUrl, JSON.stringify(data));
  }
}
