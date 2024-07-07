import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('user')
export class User {
  constructor(data?: Partial<User>) {
    Object.assign(this, data);
  }

  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @Column({ type: 'timestamptz' })
  public createdAt: Date;
}
