import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { ConversionStatus } from '../interfaces';

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

  @Column({ type: 'text' })
  public filePath: string;

  @Column({ type: 'text' })
  public status: ConversionStatus;

  @Column({ type: 'text' })
  public resolutions: string;

  @Column({ type: 'timestamptz' })
  public createdAt?: Date;
}
