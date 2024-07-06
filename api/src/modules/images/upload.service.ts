import { Injectable, Logger } from '@nestjs/common';
import { SQSService } from './sqs.service';
import { AppConfigService } from '../../config/app-config.service';

@Injectable()
export class UploadService {
  constructor(
    private readonly appConfig: AppConfigService,
    private readonly sqsService: SQSService,
    private readonly logger: Logger,
  ) {}

  public async upload(): Promise<any> {
    const queueUrl = this.appConfig.getConfig().aws.sqsUrl;
    const object = { id: 'testId', message: 'Image uploaded' };
    await this.sqsService.sendMessage(queueUrl, JSON.stringify(object));
    return { success: true };
  }
}
