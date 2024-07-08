import { Injectable, Logger } from '@nestjs/common';
import { S3 } from 'aws-sdk';
import * as Multer from 'multer';
import { readFile } from 'fs';
import { AppConfigService } from '../../config/app-config.service';

@Injectable()
export class UploadService {
  private s3: S3;
  private bucketName: string;

  constructor(
    private readonly logger: Logger,
    appConfigService: AppConfigService,
  ) {
    const config = appConfigService.getConfig();
    this.s3 = new S3({
      accessKeyId: config.aws.accessKeyId,
      secretAccessKey: config.aws.secretAccessKey,
      region: config.aws.region,
    });

    this.bucketName = config.aws.bucketName;
  }

  async uploadFilesToS3(path: string, file: Multer.File): Promise<string> {
    const fileContent = await this.readFileFromDisk(file);
    const uploadParams = {
      Bucket: this.bucketName,
      Key: `${path}`,
      Body: fileContent,
      ContentType: file.mimetype,
    };

    const uploadResult = await this.s3.upload(uploadParams).promise();
    return uploadResult.Key;
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
