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
      default: 5432,
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
  aws: {
    region: {
      doc: 'AWS region',
      env: 'AWS_REGION',
      default: '',
    },
    accessKeyId: {
      doc: 'AWS access key id',
      env: 'AWS_ACCESS_KEY_ID',
      default: '',
    },
    secretAccessKey: {
      doc: 'AWS secret access key',
      env: 'AWS_SECRET_ACCESS_KEY',
      default: '',
    },
    bucketName: {
      doc: 'AWS S3 bucket name',
      env: 'AWS_S3_BUCKET_NAME',
      default: '',
    },
    sqsUrlWorker: {
      doc: 'AWS SQS URL',
      env: 'AWS_SQS_URL',
      default: '',
    },
    sqsUrlServer: {
      doc: 'AWS SQS URL FAILED',
      env: 'AWS_SQS_URL_FAILED',
      default: '',
    },
  },
});

convictSchema.validate({ allowed: 'strict' });
export default convictSchema.getProperties();
