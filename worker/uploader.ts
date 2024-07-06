export interface IUploader {
  uploadResizedImage(resizedImage: string): Promise<string>;
}

export class S3Uploader implements IUploader {
  uploadResizedImage(resizedImage: string): Promise<string> {
    return Promise.resolve("");
  }
}
