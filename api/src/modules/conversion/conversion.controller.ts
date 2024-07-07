import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { ConversionService } from './conversion.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import * as Multer from 'multer';
import { join } from 'path';
import { unlink } from 'fs';
import { v4 as uuidv4 } from 'uuid';

@Controller('images')
@ApiTags('Images')
export class ConversionController {
  private readonly MIN_FILES = 1;
  private readonly MAX_FILES = 5;
  private readonly SUPPORTED_FILE_TYPES = ['image/jpeg', 'image/png'];
  private readonly TEMP_FOLDER = join(__dirname, '.', 'tempUploads');

  constructor(private readonly conversionService: ConversionService) {}

  @Post('upload')
  @HttpCode(HttpStatus.CREATED)
  @ApiResponse({
    status: 200,
    description: 'Returns value indicating that the upload was successful.',
  })
  @UseInterceptors(
    FilesInterceptor('files', null, {
      storage: Multer.diskStorage({
        // This is needed temporarily to store the files before upload
        destination: join(__dirname, '.', 'tempUploads'),
        filename: (_, file, cb) => {
          cb(null, `${uuidv4()}-${file.originalname}`);
        },
      }),
    }),
  )
  async uploadFiles(
    @Body('userId') userId: string,
    @Body('resolutions') resolutions: string | string[],
    @UploadedFiles() files: Multer.File[],
  ) {
    // Ensure resolutions is an array of strings
    const resolutionsArray = typeof resolutions === 'string' ? resolutions.split(',') : resolutions;

    this.validateFiles(resolutionsArray, files);

    const result = await this.conversionService.createConversion(userId, resolutionsArray, files);
    if (!result) {
      throw new InternalServerErrorException(`Failed to upload files. Please try again later.`);
    }

    this.deleteFiles(files);
    return result;
  }

  private validateFiles(resolutions: string[], files: Multer.File[]): void {
    if (!files || files.length < this.MIN_FILES || files.length > this.MAX_FILES) {
      // Clean up temporary created files before throwing an exception
      this.deleteFiles(files);

      throw new BadRequestException(
        `Number of files uploaded must be between ${this.MIN_FILES} and ${this.MAX_FILES}.`,
      );
    }

    files.forEach((file) => {
      if (!this.SUPPORTED_FILE_TYPES.includes(file.mimetype)) {
        this.deleteFiles(files);
        throw new BadRequestException(`File type ${file.mimetype} is not supported.`);
      }
    });

    if (!resolutions || resolutions.length === 0) {
      this.deleteFiles(files);
      throw new BadRequestException(`Resolutions must be provided.`);
    }
  }

  private async deleteFiles(files: Multer.File[]): Promise<void> {
    if (!files) {
      return;
    }

    files.forEach((file) => {
      const filePath = join(this.TEMP_FOLDER, file.filename);
      unlink(filePath, (err) => {
        if (err) {
          console.error(`Failed to delete file: ${filePath}`);
        }
      });
    });
  }
}
