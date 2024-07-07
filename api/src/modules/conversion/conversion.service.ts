import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { SQSService } from './sqs.service';
import { AppConfigService } from '../../config/app-config.service';
import { UserService } from '../user/user.service';
import * as Multer from 'multer';
import { UploadService } from './upload.service';
import { ConversionRequestRepository } from './repository/conversionRequest.repository';
import { ConversionTaskRepository } from './repository/conversionTask.repository';

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
    private readonly convesrioRequestRepository: ConversionRequestRepository,
    private readonly conversionTaskRepository: ConversionTaskRepository,
  ) {}

  onModuleInit() {
    this.startListening();
  }

  async startListening() {
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

  public async createConversion(
    userId: string,
    resolutions: string[],
    files: Multer.File[],
  ): Promise<any> {
    let user = await this.userService.getUserById(userId);
    if (!user) {
      this.logger.debug(`User with id ${userId} not found, creating new user`);
      user = await this.userService.createUser(userId);
    }

    let uploadResult = {
      success: [],
      error: [],
    };

    let imageRequests = [];
    let tasks = [];
    let messages = [];

    const uploadPromises = files.map(async (file) => {
      try {
        const createRequest = this.createConversionRequest(userId, resolutions, file);
        imageRequests.push(createRequest);
        await this.uploadFileToS3(createRequest.filePath, file);
        uploadResult.success.push(file.originalname);

        const resolutionPromises = resolutions.map(async (resolution) => {
          const task = this.createConversionTask(userId, createRequest.id, resolution);
          tasks.push(task);
          const message = {
            target: 'worker',
            userId: userId,
            requestId: createRequest.id,
            taskId: task.id,
            fileName: file.originalname,
            resolution: resolution,
            filePath: createRequest.filePath,
            mimeType: file.mimetype,
          };
          messages.push(message);
        });

        await Promise.all(resolutionPromises);
      } catch (error) {
        this.logger.error(`Failed to upload files for user ${userId}`, error.stack);
        uploadResult.error.push({ file: file.filename, error: error });
      }
    });

    // Upload images in parallel
    await Promise.all(uploadPromises);

    // Save bulk data
    await this.convesrioRequestRepository.save(imageRequests);
    await this.conversionTaskRepository.save(tasks);

    // TODO: Optimize it to send messages in bulk
    for (var message of messages) {
      // make delay of 1 second
      await new Promise((resolve) => setTimeout(resolve, 100));
      await this.sendMessageToWorker(message);
    }

    return uploadResult;
  }

  private createConversionRequest(userId: string, resolutions: string[], file: Multer.File) {
    const conversionRequestId = uuidv4();
    const s3Path = `users/${userId}/${conversionRequestId}/${file.originalname}`;
    const request = {
      id: conversionRequestId,
      userId: userId,
      fileName: file.originalname,
      fileSize: file.size,
      fileType: file.mimetype,
      conversionRequestInfo: {
        resolutions,
      },
      filePath: `${s3Path}`,
    };

    return request;
  }

  private createConversionTask(userId: string, requestId: string, resolution: string) {
    const conversionTaskId = uuidv4();
    return {
      id: conversionTaskId,
      userId: userId,
      requestId: requestId,
      conversionRequestInfo: {
        resolution,
      },
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
