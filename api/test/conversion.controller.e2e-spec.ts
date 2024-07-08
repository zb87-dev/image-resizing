import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Logger } from '@nestjs/common';
import * as request from 'supertest';
import { join } from 'path';
import { ConversionController } from '../src/modules/conversion/conversion.controller';
import { ConversionService } from '../src/modules/conversion/conversion.service';
import { AppConfigService } from '../src/config/app-config.service';
import { SQSService } from '../src/modules/conversion/sqs.service';
import { UserModule } from '../src/modules/user/user.module';
import { UploadService } from '../src/modules/conversion/upload.service';
import { ImageFiles } from './mocks';
import { ConversionRequestRepository } from '../src/modules/conversion/repository/conversionRequest.repository';
import { ConversionTaskRepository } from '../src/modules/conversion/repository/conversionTask.repository';

describe('UploadController', () => {
  let app: INestApplication;
  let userId: string;

  const getFile = (fileName: ImageFiles) => join(__dirname, 'test-files', fileName);

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [UserModule],
      controllers: [ConversionController],
      providers: [
        ConversionService,
        AppConfigService,
        SQSService,
        Logger,
        UploadService,
        ConversionRequestRepository,
        ConversionTaskRepository,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    userId = '0444910d-400c-4535-8b27-0c839e549cfb';
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /conversion', () => {
    it('should throw an exception when there are no provided files', async () => {
      const response = await request(app.getHttpServer())
        .post('/conversion')
        .field('userId', userId);

      expect(response.status).toBe(400);
    });

    it('should throw an exception when passed unsupported file type', async () => {
      const response = await request(app.getHttpServer())
        .post('/conversion')
        .field('userId', userId)
        .attach('files', getFile(ImageFiles.JPG_Example_1))
        .attach('files', getFile(ImageFiles.SVG_Example));

      expect(response.status).toBe(400);
    });

    it('should throw an exception when uploading more than 5 files', async () => {
      const response = await request(app.getHttpServer())
        .post('/conversion')
        .field('userId', userId)
        .attach('files', getFile(ImageFiles.JPG_Example_1))
        .attach('files', getFile(ImageFiles.JPG_Example_2))
        .attach('files', getFile(ImageFiles.JPG_Example_3))
        .attach('files', getFile(ImageFiles.JPG_Example_4))
        .attach('files', getFile(ImageFiles.JPG_Example_5))
        .attach('files', getFile(ImageFiles.PNG_Example));

      expect(response.status).toBe(400);
    });

    // it('should throw an exception if resolution is not provided', async () => {
    //   const response = await request(app.getHttpServer())
    //     .post('/images/upload')
    //     .field('userId', userId)
    //     .attach('files', getFile(ImageFiles.JPG_Example_1));

    //   expect(response.status).toBe(400);
    // });

    it('should accept 1 file', async () => {
      const response = await request(app.getHttpServer())
        .post('/conversion')
        .field('userId', userId)
        .attach('files', getFile(ImageFiles.JPG_Example_1));

      expect(response.status).toBe(201);
    });

    it('should accept maximum 5 files', async () => {
      const response = await request(app.getHttpServer())
        .post('/conversion')
        .field('userId', userId)
        .attach('files', getFile(ImageFiles.JPG_Example_1))
        .attach('files', getFile(ImageFiles.JPG_Example_2))
        .attach('files', getFile(ImageFiles.JPG_Example_3))
        .attach('files', getFile(ImageFiles.JPG_Example_4))
        .attach('files', getFile(ImageFiles.JPG_Example_5));

      expect(response.status).toBe(201);
    });
  });

  describe('user', () => {
    it(`should be able to get his conversions`, async () => {
      const response = await request(app.getHttpServer()).get('/conversion').query({ userId });
      expect(response.status).toBe(200);
    });

    it('should be able to upload file for conversion', async () => {
      const response = await request(app.getHttpServer())
        .post('/conversion')
        .field('userId', userId)
        .attach('files', getFile(ImageFiles.JPG_Example_1));

      expect(response.status).toBe(201);
    });

    it('should be able start conversion for selected resolutions', async () => {
      const response = await request(app.getHttpServer())
        .post('/conversion')
        .field('userId', userId)
        .attach('files', getFile(ImageFiles.JPG_Example_1));

      expect(response.status).toBe(201);

      const { id } = response.body.success[0];
      const resolutions = ['640x480', '1280x720', '1920x1080'];
      const startConversionResponse = await request(app.getHttpServer())
        .post(`/conversion/${id}/start`)
        .send({ resolutions, userId });

      expect(startConversionResponse.status).toBe(200);
    });
  });
});
