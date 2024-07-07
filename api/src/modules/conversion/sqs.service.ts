import { Injectable, Logger } from '@nestjs/common';
import { SQS } from 'aws-sdk';

@Injectable()
export class SQSService {
  private sqs: SQS;

  constructor(private readonly logger: Logger) {
    this.sqs = new SQS({
      region: process.env.AWS_REGION,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    });
  }

  public async sendMessage(queueUrl: string, messageBody: string): Promise<void> {
    const params = {
      QueueUrl: queueUrl,
      MessageBody: messageBody,
    };

    const result = await this.sqs.sendMessage(params).promise();
    this.logger.log(`Message sent to the queue: ${result.MessageId}`);
  }
}
