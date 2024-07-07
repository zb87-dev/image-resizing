import { Logger, Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { ConversionService } from './conversion.service';
import { SQSService } from './sqs.service';
import { AppConfigService } from '../../config/app-config.service';
import { UserModule } from '../user/user.module';

@Module({
  imports: [UserModule],
  controllers: [UploadController],
  providers: [AppConfigService, ConversionService, SQSService, Logger],
  exports: [],
})
export class ConversionModule {}
