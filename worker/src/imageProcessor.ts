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

    const imageData: ImageProcessingData = JSON.parse(message.Body);
    try {
      console.log(`Processing task ${imageData.taskId}`);
      // Inform server that image processing has started
      // const inProgressMessage = {
      //   ...imageData,
      //   target: Target.SERVER,
      //   status: ConversionStatus.IN_PROGRESS,
      // };
      // await this.messageBroker.sendImageProcessingUpdate({
      //   message: inProgressMessage,
      // });

      // Resize the image
      const resizedImage = await this.imageResizer.resizeImage(imageData);

      // Inform server that image processing has finished
      const processFinishedMessage = {
        ...resizedImage,
        target: Target.SERVER,
        status: ConversionStatus.COMPLETED,
      };

      await this.messageBroker.sendImageProcessingUpdate({
        message: processFinishedMessage,
      });
    } catch (error: any) {
      const messageToSend = {
        ...imageData,
        errorMessage: error.message,
        target: Target.SERVER,
        status: ConversionStatus.FAILED,
      };

      await this.messageBroker.sendImageProcessingUpdate({
        message: messageToSend,
      });

      console.error("Error processing image:", error);
      return false;
    }

    return true;
  }
}
