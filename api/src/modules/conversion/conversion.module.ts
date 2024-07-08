import { Logger, Module } from '@nestjs/common';
import { ConversionController } from './conversion.controller';
import { ConversionService } from './conversion.service';
import { SQSService } from './sqs.service';
import { AppConfigService } from '../../config/app-config.service';
import { UserModule } from '../user/user.module';
import { UploadService } from './upload.service';
import { ConversionRequestRepository } from './repository/conversionRequest.repository';
import { ConversionTaskRepository } from './repository/conversionTask.repository';
import { ScheduleModule } from '@nestjs/schedule';
import { CronService } from './cron.service';

@Module({
  imports: [UserModule, ScheduleModule.forRoot()],
  controllers: [ConversionController],
  providers: [
    AppConfigService,
    ConversionService,
    SQSService,
    UploadService,
    ConversionRequestRepository,
    ConversionTaskRepository,
    Logger,
    CronService,
  ],
  exports: [ConversionRequestRepository, ConversionTaskRepository],
})
export class ConversionModule {}
