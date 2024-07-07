import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Logger } from '@nestjs/common';
import * as request from 'supertest';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { UploadController } from '../src/modules/conversion/upload.controller';
import { ConversionService } from '../src/modules/conversion/conversion.service';
import { AppConfigService } from '../src/config/app-config.service';
import { SQSService } from '../src/modules/conversion/sqs.service';
import { UserModule } from '../src/modules/user/user.module';

describe('UploadController', () => {
  let app: INestApplication;
  let conversionService: ConversionService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [UserModule],
      controllers: [UploadController],
      providers: [ConversionService, AppConfigService, SQSService, Logger],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    conversionService = moduleFixture.get<ConversionService>(ConversionService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /images/upload', () => {
    it('should upload files to S3', async () => {
      const filePath = join(__dirname, 'test-files', 'test-image.jpeg');
      const userId = uuidv4();
      const response = await request(app.getHttpServer())
        .post('/images/upload')
        .field('userId', userId)
        .attach('files', filePath)
        .attach('files', filePath)
        .attach('files', filePath)
        .attach('files', filePath)
        .attach('files', filePath);

      expect(response.status).toBe(200);
    });

    it('should throw an exception when uploading more than 5 files', async () => {
      const filePath = join(__dirname, 'test-files', 'test-image.jpeg');
      const userId = uuidv4();
      const response = await request(app.getHttpServer())
        .post('/images/upload')
        .field('userId', userId)
        .attach('files', filePath)
        .attach('files', filePath)
        .attach('files', filePath)
        .attach('files', filePath)
        .attach('files', filePath)
        .attach('files', filePath);

      expect(response.status).toBe(400);
    });
  });
});
