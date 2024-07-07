import { Injectable } from '@nestjs/common';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { User } from '../entities/user.entity';

@Injectable()
export class UserRepository extends Repository<User> {
  constructor(private dataSource: DataSource) {
    super(User, dataSource.createEntityManager());
  }
  private q(): SelectQueryBuilder<User> {
    return this.createQueryBuilder('user');
  }

  public async createUser(user: User): Promise<User> {
    return this.save(user);
  }

  public async getUserById(userId: string): Promise<User> {
    return this.q().andWhere(`"id" = :userId`, { userId }).getOne();
  }
}
