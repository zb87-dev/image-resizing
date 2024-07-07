import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('conversion_request')
export class ConversionRequest {
  constructor(data?: Partial<ConversionRequest>) {
    Object.assign(this, data);
  }

  @PrimaryGeneratedColumn('uuid')
  public id?: string;

  @Column({ type: 'uuid' })
  public userId: string;

  @Column({ type: 'text' })
  public fileName: string;

  @Column({ type: 'integer' })
  public fileSize: number;

  @Column({ type: 'text' })
  public fileType: string;

  @Column({ type: 'jsonb' })
  public conversionRequestInfo: any;

  @Column({ type: 'text' })
  public filePath: string;

  @Column({ type: 'timestamptz' })
  public createdAt?: Date;
}
