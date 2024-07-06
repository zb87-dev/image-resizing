import { INestApplication } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

const SWAGGER_API_ROOT = 'api/docs';
const SWAGGER_API_NAME = 'Image Resizing Api';
const SWAGGER_API_DESCRIPTION = 'Test Image Resizing Api';
const SWAGGER_API_CURRENT_VERSION = '1.0';

export const setupSwagger = (app: INestApplication) => {
  const options = new DocumentBuilder()
    .setTitle(SWAGGER_API_NAME)
    .setDescription(SWAGGER_API_DESCRIPTION)
    .setVersion(SWAGGER_API_CURRENT_VERSION)
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup(SWAGGER_API_ROOT, app, document);
};
