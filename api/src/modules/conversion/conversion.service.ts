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
import { ConversionStatus, ConversionUpdate, Target } from './interfaces';

@Injectable()
export class ConversionService implements OnModuleInit {
  private totalImagesUploadSize = 0;
  private readonly MIN_FILES = 1;
  private readonly MAX_FILES = 5;
  private readonly SUPPORTED_FILE_TYPES = ['image/jpeg', 'image/png'];

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

  public async getStats(): Promise<{
    totalImagesUploadSizeInBytes: number;
    totalImagesUploadSizeInMB: number;
  }> {
    return {
      totalImagesUploadSizeInBytes: this.totalImagesUploadSize,
      totalImagesUploadSizeInMB: Math.round((this.totalImagesUploadSize / 1024 / 1024) * 100) / 100,
    };
  }

  public async create(
    userId: string,
    files: Multer.File[],
  ): Promise<{ error?: Error; response?: any }> {
    // Validate files, return error if any
    const error = this.validateFiles(files);
    if (error) {
      return { error };
    }

    try {
      const uploadResult = {
        success: [],
        error: [],
      };

      const conversionRequests = [];
      const user = await this.userService.getUserById(userId);

      // Create promise for each upload so that we can run them in parallel
      const uploadPromises = files.map(async (file) => {
        try {
          const conversionRequest = this.createConversionRequest(user.id, file);
          conversionRequests.push(conversionRequest);
          await this.uploadFileToS3(conversionRequest.filePath, file);
          uploadResult.success.push(conversionRequest);
          this.totalImagesUploadSize += file.size;
        } catch (error) {
          this.logger.error(`Failed to upload files for user ${userId}`, error.stack);
          uploadResult.error.push({ file: file.filename, error: error.message });
        }
      });

      // Upload images in parallel
      await Promise.all(uploadPromises);

      // Save bulk data
      await this.conversionRequestRepository.save(conversionRequests);

      return { response: uploadResult };
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
    conversion.status = ConversionStatus.IN_PROGRESS;
    conversion.resolutions = JSON.stringify(resolutions);
    await this.conversionRequestRepository.save(conversion);

    const messages = [];
    // Create separate tasks for each resolution
    const tasks = resolutions.map((resolution) => {
      const task = this.createConversionTask(userId, conversionId, resolution);
      const message = {
        target: Target.WORKER,
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
    await this.sendMessagesToWorker(messages);

    return conversion;
  }

  public async processPendingTasks() {
    // create const older than 1 minute from now
    const olderThan = new Date(Date.now() - 60 * 1000);
    const status = ConversionStatus.PENDING;
    const pendingTasks = await this.conversionTaskRepository.getTasksByStatusOlderThan(
      olderThan,
      status,
    );

    if (pendingTasks.length === 0) {
      return;
    }

    this.logger.debug(
      `Found ${pendingTasks.length} pending tasks, will resend messages to the SQS.`,
    );

    const messages = [];
    for (const task of pendingTasks) {
      const message = {
        target: Target.WORKER,
        userId: task.userId,
        requestId: task.requestId,
        taskId: task.taskId,
        fileName: task.fileName,
        resolution: task.resolution,
        filePath: task.filePath,
        fileType: task.fileType,
      };

      messages.push(message);
    }

    await this.sendMessagesToWorker(messages);
  }

  public async getConversionRequests(userId: string) {
    const data =
      await this.conversionRequestRepository.getConversionRequestsDetailsByUserId(userId);

    return this.groupRequestsAndTasks(data);
  }

  private async sendMessagesToWorker(messages: ConversionUpdate[]) {
    // Inform worker using SQS to start conversion
    // TODO: Optimize it to send messages in bulk
    for (var message of messages) {
      // Make small delay to avoid throttling
      await new Promise((resolve) => setTimeout(resolve, 100));
      await this.sendMessageToWorker(message);
    }

    // TODO: Check why is not working as it should, needs more investigation
    // await this.sendBulkMessageToWorker(messages);
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
          filePath: this.getPublicUrl(curr.filePath),
          fileName: curr.fileName,
          fileSize: curr.fileSize,
          fileType: curr.fileType,
          status: curr.status,
          resolutions: curr.resolutions,
          tasks: [],
        };
        acc.push(request);
      }

      // Add the current task detail to the tasks array
      if (curr.taskId) {
        request.tasks.push({
          taskRequestId: curr.taskRequestId,
          taskId: curr.taskId,
          resolution: curr.resolution,
          taskStatus: curr.taskStatus,
          convertedFilePath: curr.convertedFilePath
            ? this.getPublicUrl(curr.convertedFilePath)
            : null,
          taskCreatedAt: curr.taskCreatedAt,
          taskUpdatedAt: curr.taskUpdatedAt,
          meta: curr.meta,
        });
      }

      return acc;
    }, []);

    return groupedTasks.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  private getPublicUrl(key: string) {
    if (!key) {
      return null;
    }

    const bucketName = this.appConfig.getConfig().aws.bucketName;
    return this.uploadService.generatePresignedUrl(bucketName, key, 60);
  }

  private async updateRequestStatus(userId: string, requestId: string) {
    const request = await this.conversionRequestRepository.getUserRequestById(userId, requestId);
    const numberOfDesiredConversions = (JSON.parse(request.resolutions) as string[]).length;
    const requestTasks = await this.conversionTaskRepository.getTasksByRequestId(requestId);

    const numberOfCompletedTasks = requestTasks.filter(
      (task) => task.status === ConversionStatus.COMPLETED,
    ).length;

    if (numberOfCompletedTasks === numberOfDesiredConversions) {
      request.status = ConversionStatus.COMPLETED;
    } else {
      request.status = ConversionStatus.IN_PROGRESS;
    }
    await this.conversionRequestRepository.save(request);
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

          if (data.message && data.message.target === Target.SERVER) {
            const message: ConversionUpdate = data.message;

            await this.sqsService.deleteMessage(queueUrl, receiptHandle);

            const task = await this.conversionTaskRepository.getTaskById(message.taskId);
            task.convertedFilePath = message.convertedFilePath;
            task.status = message.status;
            task.updatedAt = new Date();

            if (message.status === ConversionStatus.FAILED) {
              task.meta = {
                errorMessage: message.errorMessage,
              };
            }

            await this.conversionTaskRepository.save(task);
            await this.updateRequestStatus(message.userId, message.requestId);
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
      status: ConversionStatus.PENDING,
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
      status: ConversionStatus.PENDING,
    };
  }

  private async uploadFileToS3(path: string, file: Multer.File): Promise<string> {
    return this.uploadService.uploadFilesToS3(path, file);
  }

  private async sendMessageToWorker(data: unknown): Promise<void> {
    const queueUrl = this.appConfig.getConfig().aws.sqsUrlWorker;
    await this.sqsService.sendMessage(queueUrl, JSON.stringify(data));
  }

  private async sendBulkMessageToWorker(data: ConversionUpdate[]): Promise<void> {
    const queueUrl = this.appConfig.getConfig().aws.sqsUrlWorker;

    const messages = data.map((message: ConversionUpdate) => ({
      id: message.taskId,
      messageBody: JSON.stringify(message),
    }));
    await this.sqsService.sendBulkMessages(queueUrl, messages);
  }

  private validateFiles(files: Multer.File[]): BadRequestException {
    if (!files || files.length < this.MIN_FILES || files.length > this.MAX_FILES) {
      return new BadRequestException(
        `Number of files uploaded must be between ${this.MIN_FILES} and ${this.MAX_FILES}.`,
      );
    }

    for (const file of files) {
      if (!this.SUPPORTED_FILE_TYPES.includes(file.mimetype)) {
        return new BadRequestException(`File type ${file.mimetype} is not supported.`);
      }
    }
  }
}
