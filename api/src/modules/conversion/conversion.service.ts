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
        const conversionRequestId = uuidv4();
        const path = `users/${userId}/${conversionRequestId}`;
        const request = {
          id: conversionRequestId,
          userId: userId,
          fileName: file.originalname,
          fileSize: file.size,
          fileType: file.mimetype,
          conversionRequestInfo: {
            resolutions,
          },
          filePath: `${path}/${file.originalname}`,
        };

        await this.convesrioRequestRepository.createRequest(request);

        for (const resolution of resolutions) {
          const conversionTaskId = uuidv4();
          await this.conversionTaskRepository.createTask({
            id: conversionTaskId,
            userId: userId,
            requestId: conversionRequestId,
            conversionRequestInfo: {
              resolution,
            },
            status: 'pending',
          });
        }

        //const result = await this.uploadFileToS3(path, file);
        // uploadResult.success.push(result, file);
      } catch (error) {
        this.logger.error(`Failed to upload files for user ${userId}`);
        uploadResult.error.push({ file, error: error });
      }
    }

    return uploadResult;
  }

  private async uploadFileToS3(path: string, file: Multer.File): Promise<any> {
    return this.uploadService.uploadFilesToS3(path, file);
  }

  private async sendMessage(): Promise<boolean> {
    const queueUrl = this.appConfig.getConfig().aws.sqsUrl;
    const object = { id: 'testId', message: 'Image uploaded' };

    await this.sqsService.sendMessage(queueUrl, JSON.stringify(object));
    return true;
  }
}
