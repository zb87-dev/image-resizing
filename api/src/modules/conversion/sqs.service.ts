import { Injectable } from '@nestjs/common';
import { SQS } from 'aws-sdk';

@Injectable()
export class SQSService {
  private sqs: SQS;

  constructor() {
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

    await this.sqs.sendMessage(params).promise();
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
