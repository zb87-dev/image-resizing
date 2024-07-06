import { IImageProcessor, ImageProcessor } from "./imageProcessor";
import { IImageResizer, ImageResizer } from "./imageResizer";
import { IUploader, S3Uploader } from "./uploader";

export class Factory {
  static createImageUploader(): IUploader {
    return new S3Uploader();
  }
  static createImageResizer(): IImageResizer {
    return new ImageResizer();
  }

  static createImageProcessor(): IImageProcessor {
    return new ImageProcessor(
      Factory.createImageResizer(),
      Factory.createImageUploader()
    );
  }
}
