import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConversionService } from './conversion.service';

@Injectable()
export class CronService {
  constructor(private readonly conversionService: ConversionService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron() {
    await this.conversionService.processPendingTasks();
  }
}
