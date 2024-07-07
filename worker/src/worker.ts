import { IImageProcessor } from "./imageProcessor";
import { IMessageBroker } from "./messageBroker";

export interface IWorker {
  start(): Promise<void>;
}

export class ImageProcessorWorker implements IWorker {
  constructor(
    private readonly messageBroker: IMessageBroker,
    private readonly imageProcessor: IImageProcessor
  ) {}

  async start() {
    while (true) {
      const message = await this.messageBroker.listenForProcessingRequests();
      if (!message) {
        continue;
      }
      const body = JSON.parse(message.Body);
      if (body.target === "worker") {
        await this.imageProcessor.processImage(message);
        await this.messageBroker.deleteMessage(message);
      }
    }
  }
}
