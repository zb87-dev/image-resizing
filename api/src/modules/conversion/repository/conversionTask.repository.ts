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
}
