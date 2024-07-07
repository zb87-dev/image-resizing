import { Injectable, Logger } from '@nestjs/common';
import { S3 } from 'aws-sdk';
import * as Multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { readFile } from 'fs';
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

  async uploadFilesToS3(path: string, file: Multer.File): Promise<string> {
    const fileContent = await this.readFileFromDisk(file);
    const uploadParams = {
      Bucket: this.bucketName,
      Key: `${path}/${file.originalname}`,
      Body: fileContent,
      ContentType: file.mimetype,
    };

    const uploadResult = await this.s3.upload(uploadParams).promise();
    return uploadResult.Key;
    // console.log('UPLOAD RESULT', uploadResult);
    // result.push(uploadResult);

    // const ss = this.generatePresignedUrl(this.bucketName, uploadResult.Key, 60);
    // console.log(ss);
    // return result;
  }

  async readFileFromDisk(file: Multer.File): Promise<any> {
    return new Promise((resolve, reject) => {
      readFile(file.path, (err, data) => {
        if (err) {
          this.logger.error(`Failed to read file from disk: ${err}`);
          reject(err);
        }

        resolve(data);
      });
    });
  }

  public generatePresignedUrl(bucketName: string, objectKey: string, expiryTime: number): string {
    const params = {
      Bucket: bucketName,
      Key: objectKey,
      Expires: expiryTime,
    };

    return this.s3.getSignedUrl('getObject', params);
  }
}
