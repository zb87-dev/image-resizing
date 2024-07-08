import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { ConversionStatus } from '../interfaces';

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

  @Column({ type: 'text' })
  public resolution: string;

  @Column({ type: 'text' })
  public convertedFilePath?: string;

  @Column({ type: 'text' })
  public status: ConversionStatus;

  @Column({ type: 'timestamptz' })
  public createdAt?: Date;

  @Column({ type: 'timestamptz' })
  public updatedAt?: Date;
}
