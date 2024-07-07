import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('conversion_task')
export class ConversionTask {
  constructor(data?: Partial<ConversionTask>) {
    Object.assign(this, data);
  }

  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @Column({ type: 'uuid' })
  public userId: string;

  @Column({ type: 'uuid' })
  public requestId: string;

  @Column({ type: 'jsonb' })
  public conversionRequestInfo: any;
  @Column({ type: 'text' })
  public convertedFilePath?: string;

  @Column({ type: 'text' })
  public status: string;

  @Column({ type: 'timestamptz' })
  public createdAt?: Date;

  @Column({ type: 'timestamptz' })
  public updatedAt?: Date;
}
