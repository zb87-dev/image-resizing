import { Injectable } from '@nestjs/common';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { ConversionRequest } from '../entities/conversionRequest.entity';

@Injectable()
export class ConversionRequestRepository extends Repository<ConversionRequest> {
  constructor(private dataSource: DataSource) {
    super(ConversionRequest, dataSource.createEntityManager());
  }
  private q(): SelectQueryBuilder<ConversionRequest> {
    return this.createQueryBuilder('conversion_request');
  }

  public async createRequest(request: ConversionRequest): Promise<ConversionRequest> {
    return this.save(request);
  }
}
