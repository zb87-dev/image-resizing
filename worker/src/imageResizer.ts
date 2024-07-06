export interface IImageResizer {
  resizeImage(imageUrl: any): Promise<string>;
}

export class ImageResizer implements IImageResizer {
  resizeImage(imageUrl: any): Promise<string> {
    return Promise.resolve("");
  }
}
