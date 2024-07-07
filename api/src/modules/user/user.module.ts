import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import dataSource from '../../database/typeOrm.config';
import dbConfig from '../../database/dbConfig';

import { UserService } from './user.service';
import { UserRepository } from './repository/user.repository';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => dbConfig,
      dataSourceFactory: async () => {
        return dataSource.initialize();
      },
    }),
  ],
  controllers: [],
  providers: [UserService, UserRepository],
  exports: [UserService],
})
export class UserModule {}
