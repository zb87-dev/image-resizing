import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { SQSService } from './sqs.service';
import { AppConfigService } from '../../config/app-config.service';
import { UserService } from '../user/user.service';

@Injectable()
export class ConversionService {
  constructor(
    private readonly appConfig: AppConfigService,
    private readonly sqsService: SQSService,
    private readonly logger: Logger,
    private readonly userService: UserService,
  ) {}

  public async upload(): Promise<any> {
    const queueUrl = this.appConfig.getConfig().aws.sqsUrl;
    const object = { id: 'testId', message: 'Image uploaded' };
    await this.sqsService.sendMessage(queueUrl, JSON.stringify(object));
    return { success: true };
  }
}
