import { IImageResizer } from "./imageResizer";
import { IMessageBroker } from "./messageBroker";
import { IUploader } from "./uploader";

export interface IImageProcessor {
  processImage(imageDetails: any): Promise<boolean>;
}

export class ImageProcessor implements IImageProcessor {
  constructor(
    private readonly messageBroker: IMessageBroker,
    private readonly imageResizer: IImageResizer,
    private readonly uploader: IUploader
  ) {}

  async processImage(message: any): Promise<boolean> {
    if (!message) {
      console.error("Invalid message received", message);
      return false;
    }

    var resizedImage = "";
    try {
      console.log("\n\nProcessing image:", message.Body);
      //Process the message
      resizedImage = await this.imageResizer.resizeImage(message.imageUrl);
    } catch (error) {
      await this.messageBroker.setImageProcessingFailure({
        message,
        error,
      });
      console.error("Error processing image:", error);
      return false;
    }

    try {
      //Upload the resized image
      const uploadResult = await this.uploader.uploadResizedImage(resizedImage);
      // Check upload result and return true if successful

      return true;
    } catch (error) {
      console.error("Error processing image:", error);
      await this.messageBroker.setImageProcessingFailure({ message, error });
      return false;
    }
  }
}
