import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication, Logger } from '@nestjs/common';
import * as request from 'supertest';
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
    it('should return 200 OK and indicate successful upload', async () => {
      const response = await request(app.getHttpServer()).post('/images/upload').send({});

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toEqual({ success: true });
    });
  });
});
