import { DataSourceOptions } from 'typeorm';
import { join } from 'path';
import config from '../config/configuration';

const dbConfig: DataSourceOptions = {
  type: 'postgres',
  url: config.dbConfig.url,
  entities: [join(__dirname, '/../modules/**/*.entity.{ts,js}')],
  synchronize: false,
  logging: false,
  ssl: {
    rejectUnauthorized: false,
  },
};

export default dbConfig;
