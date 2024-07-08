import { Injectable } from '@nestjs/common';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { ConversionTask } from '../entities/conversionTask.entity';

@Injectable()
export class ConversionTaskRepository extends Repository<ConversionTask> {
  constructor(private dataSource: DataSource) {
    super(ConversionTask, dataSource.createEntityManager());
  }
  private q(): SelectQueryBuilder<ConversionTask> {
    return this.createQueryBuilder('conversion_task');
  }

  public async getTaskById(id: string): Promise<ConversionTask | undefined> {
    return this.q().where('"id" = :id', { id }).getOne();
  }

  public async createTask(task: ConversionTask): Promise<ConversionTask> {
    return this.save(task);
  }

  public async getTasksByStatusOlderThan(olderThan: Date, status: string) {
    return this.manager.query(
      `
      select
      ct."userId",
      ct."requestId",
      ct."id" as "taskId",
      ct."resolution",
      cr."fileName",
      cr."filePath",
      cr."fileType"
      from conversion_task ct
      inner join conversion_request cr on ct."requestId" = cr."id"
      where ct."status" = $2 and ct."createdAt" <= $1
      `,
      [olderThan, status],
    );
  }
}
