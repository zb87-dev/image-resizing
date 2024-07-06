import * as convict from 'convict';
import * as dotenv from 'dotenv';
import * as path from 'path';

const environment = process.env.NODE_ENV ? process.env.NODE_ENV : '';
dotenv.config({ path: path.join(__dirname, `../../${environment}.env`) });

const convictSchema = convict({
  port: {
    doc: 'Port to run the service on',
    env: 'PORT',
    format: 'port',
    default: 3000,
  },
  dbConfig: {
    hostname: {
      doc: 'Hostname of the database',
      env: 'DB_HOST',
      default: '',
    },
    port: {
      doc: 'Port of the database',
      env: 'DB_PORT',
      default: '',
    },
    username: {
      doc: 'Username of the database',
      env: 'DB_USERNAME',
      default: '',
    },
    password: {
      doc: 'Password of the database',
      env: 'DB_PASSWORD',
      default: '',
    },
    databaseName: {
      doc: 'Postgres database name',
      env: 'DB_NAME',
      default: '',
    },
  },
});

convictSchema.validate({ allowed: 'strict' });
export default convictSchema.getProperties();
