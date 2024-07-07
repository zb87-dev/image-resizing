import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { SQSService } from './sqs.service';
import { AppConfigService } from '../../config/app-config.service';
import { UserService } from '../user/user.service';
import * as Multer from 'multer';
import { UploadService } from './upload.service';
import { ConversionRequestRepository } from './repository/conversionRequest.repository';
import { ConversionTaskRepository } from './repository/conversionTask.repository';

@Injectable()
export class ConversionService {
  constructor(
    private readonly appConfig: AppConfigService,
    private readonly sqsService: SQSService,
    private readonly logger: Logger,
    private readonly userService: UserService,
    private readonly uploadService: UploadService,
    private readonly convesrioRequestRepository: ConversionRequestRepository,
    private readonly conversionTaskRepository: ConversionTaskRepository,
  ) {}

  private async createConversionRequest(userId: string, resolutions: string[], file: Multer.File) {
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

    return this.convesrioRequestRepository.createRequest(request);
  }

  private async createConversionTask(userId: string, requestId: string, resolution: string) {
    const conversionTaskId = uuidv4();
    return this.conversionTaskRepository.createTask({
      id: conversionTaskId,
      userId: userId,
      requestId: requestId,
      conversionRequestInfo: {
        resolution,
      },
      status: 'pending',
    });
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

    for (const file of files) {
      try {
        const createRequest = await this.createConversionRequest(userId, resolutions, file);
        for (const resolution of resolutions) {
          const task = await this.createConversionTask(userId, createRequest.id, resolution);
          await this.uploadFileToS3(createRequest.filePath, file);
          uploadResult.success.push(file.originalname);
          const message = {
            userId: userId,
            requestId: createRequest.id,
            taskId: task.id,
            fileName: file.originalname,
            resolution: resolution,
            filePath: createRequest.filePath,
          };
          await this.sendMessage(message);
        }
      } catch (error) {
        this.logger.error(`Failed to upload files for user ${userId}`);
        uploadResult.error.push({ file: file.filename, error: error });
      }
    }

    return uploadResult;
  }

  private async uploadFileToS3(path: string, file: Multer.File): Promise<string> {
    return this.uploadService.uploadFilesToS3(path, file);
  }

  private async sendMessage(data: unknown): Promise<void> {
    const queueUrl = this.appConfig.getConfig().aws.sqsUrl;
    await this.sqsService.sendMessage(queueUrl, JSON.stringify(data));
  }
}
