import { IImageProcessor, ImageProcessor } from "./imageProcessor";
import { IImageResizer, ImageResizer } from "./imageResizer";
import { IMessageBroker, SQSMessageBroker } from "./messageBroker";
import { IUploader, S3Uploader } from "./uploader";
import { ImageProcessorWorker, IWorker } from "./worker";

export class Factory {
  static createWorker(): IWorker {
    const imageProcessor = Factory.createImageProcessor();
    const messageBroker = Factory.createMessageBroker();

    return new ImageProcessorWorker(messageBroker, imageProcessor);
  }
  static createImageUploader(): IUploader {
    return new S3Uploader();
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
      Factory.createImageResizer(),
      Factory.createImageUploader()
    );
  }
}
