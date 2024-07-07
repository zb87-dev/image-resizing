import { Logger, Module } from '@nestjs/common';
import { ConversionController } from './conversion.controller';
import { ConversionService } from './conversion.service';
import { SQSService } from './sqs.service';
import { AppConfigService } from '../../config/app-config.service';
import { UserModule } from '../user/user.module';
import { UploadService } from './upload.service';
import { ConversionRequestRepository } from './repository/conversionRequest.repository';
import { ConversionTaskRepository } from './repository/conversionTask.repository';

@Module({
  imports: [UserModule],
  controllers: [ConversionController],
  providers: [
    AppConfigService,
    ConversionService,
    SQSService,
    UploadService,
    ConversionRequestRepository,
    ConversionTaskRepository,
    Logger,
  ],
  exports: [ConversionRequestRepository, ConversionTaskRepository],
})
export class ConversionModule {}
