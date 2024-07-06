import { Module } from '@nestjs/common';
import { AppConfigService } from './config/app-config.service';
import { UploadModule } from './modules/images/upload.module';

@Module({
  imports: [UploadModule],
  controllers: [],
  providers: [AppConfigService],
})
export class AppModule {}
