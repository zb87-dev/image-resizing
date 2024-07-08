import { IImageProcessor, ImageProcessor } from "./imageProcessor";
import { IImageResizer, ImageResizer } from "./imageResizer";
import { IMessageBroker, SQSMessageBroker } from "./messageBroker";
import { ImageProcessorWorker, IWorker } from "./worker";

export class Factory {
  static createWorker(): IWorker {
    const imageProcessor = Factory.createImageProcessor();
    const messageBroker = Factory.createMessageBroker();

    return new ImageProcessorWorker(messageBroker, imageProcessor);
  }

  static createImageResizer(): IImageResizer {
    return new ImageResizer();
  }

  static createMessageBroker(): IMessageBroker {
    return new SQSMessageBroker();
  }

  static createImageProcessor(): IImageProcessor {
    return new ImageProcessor(
      Factory.createMessageBroker(),
      Factory.createImageResizer()
    );
  }
}
