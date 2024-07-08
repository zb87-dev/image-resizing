import { ImageProcessingData } from "./interfaces";
import { S3 } from "aws-sdk";
import sharp from "sharp";
import { PassThrough } from "stream";

export interface IImageResizer {
  resizeImage(imageData: any): Promise<any>;
}

export class ImageResizer implements IImageResizer {
  private bucketName: string;
  private s3: S3;
  constructor() {
    this.s3 = new S3({
      region: process.env.AWS_REGION,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    });
    this.bucketName = process.env.AWS_BUCKET_NAME || "";
  }

  public generatePresignedUrl(
    bucketName: string,
    objectKey: string,
    expiryTime: number
  ): string {
    const params = {
      Bucket: bucketName,
      Key: objectKey,
      Expires: expiryTime,
    };

    return this.s3.getSignedUrl("getObject", params);
  }

  async resizeImage(imageData: ImageProcessingData): Promise<any> {
    try {
      // Download the image from S3
      const imageStream = this.s3
        .getObject({
          Bucket: this.bucketName,
          Key: imageData.filePath,
        })
        .createReadStream();

      // get the width and height from the resolution
      const [width, height] = imageData.resolution.split("x");

      // get file extension from the file name
      const fileExtension = imageData.fileName.split(".").pop();

      // Resize the image using sharp library
      const resizedImageStream = imageStream.pipe(
        sharp()
          .resize(Number.parseInt(width), Number.parseInt(height))
          .toFormat(fileExtension === "png" ? "png" : "jpeg")
      );

      // Upload the resized image back to S3
      const pass = new PassThrough();
      const outputKey = `users/${imageData.userId}/${imageData.requestId}/converted/${imageData.resolution}/${imageData.fileName}`;

      const uploadParams = {
        Bucket: this.bucketName,
        Key: outputKey,
        Body: pass,
        ContentType: imageData.mimeType,
      };

      const uploadPromise = this.s3.upload(uploadParams).promise();

      resizedImageStream.pipe(pass);

      await uploadPromise;

      return Promise.resolve({ ...imageData, convertedFilePath: outputKey });
    } catch (error) {
      console.error("Error processing image:", error, imageData);
    }
  }
}
