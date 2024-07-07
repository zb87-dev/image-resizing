import { SQS } from "aws-sdk";

export interface IMessageBroker {
  sendImageProcessingUpdate(param: { message: any }): Promise<void>;
  setImageProcessingFailure(param: { message: any; error: any }): Promise<void>;
  listenForProcessingRequests(): Promise<any>;
  deleteMessage(receiptHandle: string): Promise<any>;
}

export class SQSMessageBroker implements IMessageBroker {
  private sqs: SQS;
  private processRequestQueueUrl: string;
  private failedRequestsQueueUrl: string;

  private readonly MaxNumberOfMessages = 10;
  private readonly WaitTimeSeconds = 20;

  constructor() {
    this.sqs = new SQS({
      region: process.env.AWS_REGION,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    });

    this.processRequestQueueUrl = process.env.AWS_PROCESS_REQUEST_SQS_URL || "";
    this.failedRequestsQueueUrl = process.env.AWS_FAILED_REQUEST_SQS_URL || "";
  }
  async setImageProcessingFailure(param: {
    message: any;
    error: any;
  }): Promise<any> {
    return this.sqs
      .sendMessage({
        QueueUrl: this.failedRequestsQueueUrl,
        MessageBody: JSON.stringify(param),
      })
      .promise();
  }

  async sendImageProcessingUpdate(param: { message: any }): Promise<any> {
    return this.sqs
      .sendMessage({
        QueueUrl: this.failedRequestsQueueUrl,
        MessageBody: JSON.stringify(param),
      })
      .promise();
  }

  async listenForProcessingRequests(): Promise<any> {
    try {
      const data = await this.sqs
        .receiveMessage({
          QueueUrl: this.processRequestQueueUrl,
          MaxNumberOfMessages: this.MaxNumberOfMessages,
          WaitTimeSeconds: this.WaitTimeSeconds,
        })
        .promise();

      if (!data.Messages) {
        return;
      }

      for (const message of data.Messages) {
        return Promise.resolve(message);
      }
    } catch (error) {
      console.error("Error receiving message:", error);
    }
  }

  async deleteMessage(message: any): Promise<any> {
    if (!message) {
      return;
    }

    return this.sqs
      .deleteMessage({
        QueueUrl: this.processRequestQueueUrl,
        ReceiptHandle: message.ReceiptHandle,
      })
      .promise();
  }
}
