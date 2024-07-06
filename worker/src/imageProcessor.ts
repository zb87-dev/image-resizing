import { IImageResizer } from "./imageResizer";
import { IUploader } from "./uploader";

export interface IImageProcessor {
  processImage(imageDetails: any): Promise<boolean>;
}

export class ImageProcessor implements IImageProcessor {
  constructor(
    private readonly imageResizer: IImageResizer,
    private readonly uploader: IUploader
  ) {}

  async processImage(imageDetails: any): Promise<boolean> {
    var resizedImage = "";
    try {
      //Process the message
      resizedImage = await this.imageResizer.resizeImage(imageDetails.imageUrl);
    } catch (error) {
      // await this.setImageProcessingFailure({ imageDetails, error });
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
      // await this.setImageProcessingFailure({ imageDetails, error });
      return false;
    }
  }
}
