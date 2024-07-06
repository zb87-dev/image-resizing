import { SQS } from "aws-sdk";
import { IImageProcessor } from "./imageProcessor";

export class ImageProcessorWorker {
  private sqs: SQS;
  private processRequestQueueUrl: string;
  private failedRequestsQueueUrl: string;

  private readonly MaxNumberOfMessages = 10;
  private readonly WaitTimeSeconds = 20;

  constructor(private readonly imageProcessor: IImageProcessor) {
    this.sqs = new SQS({
      region: process.env.AWS_REGION,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    });

    this.processRequestQueueUrl = process.env.AWS_PROCESS_REQUEST_SQS_URL || "";
    this.failedRequestsQueueUrl = process.env.AWS_FAILED_REQUEST_SQS_URL || "";
  }

  async start() {
    while (true) {
      await this.listenForProcessingRequests();
    }
  }

  async listenForProcessingRequests() {
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
        console.log("Received message:", message.Body);
        await this.imageProcessor.processImage(message.Body!);

        //Delete the message after processing
        await this.deleteMessage(message.ReceiptHandle!);
      }
    } catch (error) {
      console.error("Error receiving message:", error);
    }
  }

  async deleteMessage(receiptHandle: string) {
    return this.sqs
      .deleteMessage({
        QueueUrl: this.processRequestQueueUrl,
        ReceiptHandle: receiptHandle,
      })
      .promise();
  }
}
