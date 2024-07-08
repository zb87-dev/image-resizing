import { IImageResizer } from "./imageResizer";
import { ConversionStatus, ImageProcessingData, Target } from "./interfaces";
import { IMessageBroker } from "./messageBroker";

export interface IImageProcessor {
  processImage(imageDetails: any): Promise<boolean>;
}

export class ImageProcessor implements IImageProcessor {
  constructor(
    private readonly messageBroker: IMessageBroker,
    private readonly imageResizer: IImageResizer
  ) {}

  async processImage(message: any): Promise<boolean> {
    if (!message) {
      console.error("Invalid message received", message);
      return false;
    }

    try {
      const imageData: ImageProcessingData = JSON.parse(message.Body);

      // Resize the image
      const resizedImage = await this.imageResizer.resizeImage(imageData);

      const messageToSend = {
        ...resizedImage,
        target: Target.SERVER,
        status: ConversionStatus.COMPLETED,
      };

      await this.messageBroker.sendImageProcessingUpdate({
        message: messageToSend,
      });
    } catch (error) {
      await this.messageBroker.setImageProcessingFailure({
        message,
        error,
      });
      console.error("Error processing image:", error);
      return false;
    }

    return true;
  }
}
