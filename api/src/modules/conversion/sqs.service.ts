import { Injectable } from '@nestjs/common';
import { SQS } from 'aws-sdk';
import { AppConfigService } from '../../config/app-config.service';

@Injectable()
export class SQSService {
  private sqs: SQS;

  constructor(appConfigService: AppConfigService) {
    const config = appConfigService.getConfig();
    this.sqs = new SQS({
      region: config.aws.region,
      accessKeyId: config.aws.accessKeyId,
      secretAccessKey: config.aws.secretAccessKey,
    });
  }

  public async sendMessage(queueUrl: string, messageBody: string): Promise<void> {
    const params = {
      QueueUrl: queueUrl,
      MessageBody: messageBody,
    };

    await this.sqs.sendMessage(params).promise();
  }

  public async sendBulkMessages(
    queueUrl: string,
    messages: { id: string; messageBody: string }[],
  ): Promise<void> {
    const entries = messages.map((message) => ({
      Id: message.id,
      MessageBody: message.messageBody,
    }));

    await this.sqs
      .sendMessageBatch({
        Entries: entries,
        QueueUrl: queueUrl,
      })
      .promise();
  }

  // Add the receiveMessage method
  public async receiveMessage(queueUrl: string): Promise<any> {
    const params = {
      QueueUrl: queueUrl,
      MaxNumberOfMessages: 10,
      WaitTimeSeconds: 20,
    };

    const result = await this.sqs.receiveMessage(params).promise();
    return result;
  }

  public async deleteMessage(queueUrl: string, receiptHandle: string): Promise<any> {
    return this.sqs
      .deleteMessage({
        QueueUrl: queueUrl,
        ReceiptHandle: receiptHandle,
      })
      .promise();
  }
}
