import { Injectable, Logger } from '@nestjs/common';
import { S3 } from 'aws-sdk';
import * as Multer from 'multer';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UploadService {
  private s3: S3;
  private bucketName: string;

  constructor(private readonly logger: Logger) {
    this.s3 = new S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION,
    });
    this.bucketName = process.env.AWS_S3_BUCKET_NAME;
  }

  async uploadFilesToS3(path: string, file: Multer.File): Promise<any> {
    let result = [];

    const uploadParams = {
      Bucket: this.bucketName,
      Key: `${path}/${file.originalname}`,
      Body: file.buffer,
      ContentType: file.mimetype,
      Public: true,
    };

    const uploadResult = await this.s3.upload(uploadParams).promise();
    result.push(uploadResult);

    return result;
  }
}
