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
      await this.imageProcessor.processImage(message);
      await this.messageBroker.deleteMessage(message);
    }
  }
}
