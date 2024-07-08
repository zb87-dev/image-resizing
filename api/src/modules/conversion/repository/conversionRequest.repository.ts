import { Injectable } from '@nestjs/common';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { ConversionRequest } from '../entities/conversionRequest.entity';

export type ConversionRequestWithStatus = ConversionRequest & {
  status: string;
  taskCreatedAt: Date;
  taskUpdatedAt: Date;
  convertedFilePath: string;
  resolution: string;
  taskId: string;
  taskRequestId: string;
  taskStatus: string;
};

@Injectable()
export class ConversionRequestRepository extends Repository<ConversionRequest> {
  constructor(private dataSource: DataSource) {
    super(ConversionRequest, dataSource.createEntityManager());
  }
  private q(userId: string): SelectQueryBuilder<ConversionRequest> {
    return this.createQueryBuilder('conversion_request').where(`"userId" = :userId`, { userId });
  }

  public async createRequest(request: ConversionRequest): Promise<ConversionRequest> {
    return this.save(request);
  }

  public async getUserRequestById(
    userId: string,
    conversionId: string,
  ): Promise<ConversionRequest> {
    return this.q(userId).andWhere(`"id" = :conversionId`, { conversionId }).getOne();
  }

  public async getConversionRequestsDetailsByUserId(
    userId: string,
  ): Promise<ConversionRequestWithStatus[]> {
    return this.manager.query(
      `
      select
        cr.*,
        ct."id" as "taskId",
        ct."resolution",
        ct."requestId" as "taskRequestId",
        ct."status" as "taskStatus",
        ct."convertedFilePath",
        ct."createdAt" as "taskCreatedAt",
        ct."updatedAt" as "taskUpdatedAt"
      from "conversion_request" cr
      left join "conversion_task" ct on cr."userId" = ct."userId" and cr."id" = ct."requestId"
      where cr."userId" = $1
      order by cr."createdAt" desc`,
      [userId],
    );
  }
}
