import { Module } from '@nestjs/common';
import { AppConfigService } from './config/app-config.service';
import { ConversionModule } from './modules/conversion/conversion.module';

@Module({
  imports: [ConversionModule],
  controllers: [],
  providers: [AppConfigService],
})
export class AppModule {}
