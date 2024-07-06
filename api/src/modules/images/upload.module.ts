import { Logger, Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { SQSService } from './sqs.service';
import { AppConfigService } from '../../config/app-config.service';

@Module({
  imports: [],
  controllers: [UploadController],
  providers: [AppConfigService, UploadService, SQSService, Logger],
  exports: [],
})
export class UploadModule {}
