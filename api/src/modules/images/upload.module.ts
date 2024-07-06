import { Logger, Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';

@Module({
  imports: [],
  controllers: [UploadController],
  providers: [UploadService, Logger],
  exports: [],
})
export class UploadModule {}
