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
import { unlinkSync, unlink } from 'fs';
import { v4 as uuidv4 } from 'uuid';

@Controller('images')
@ApiTags('Images')
export class UploadController {
  private readonly MIN_FILES = 1;
  private readonly MAX_FILES = 5;
  private readonly SUPPORTED_FILE_TYPES = ['image/jpeg', 'image/png'];
  private readonly TEMP_FOLDER = join(__dirname, '.', 'tempUploads');

  constructor(private readonly uploadService: ConversionService) {}

  @Post('upload')
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: 201,
    description: 'Returns value indicating that the upload was successful.',
  })
  @UseInterceptors(
    FilesInterceptor('files', null, {
      storage: Multer.diskStorage({
        destination: join(__dirname, '.', 'tempUploads'), // This is needed temporarily to store the files before upload
        filename: (_, file, cb) => {
          cb(null, `${uuidv4()}-${file.originalname}`);
        },
      }),
    }),
  )
  async uploadFiles(@Body('userId') userId: string, @UploadedFiles() files: Multer.File[]) {
    this.validateFiles(files);

    const success = await this.uploadService.upload(userId, files);
    if (!success) {
      throw new InternalServerErrorException(`Failed to upload files. Please try again later.`);
    }

    this.deleteFiles(files);
    return { success: true };
  }

  private validateFiles(files: Multer.File[]): void {
    if (files.length < this.MIN_FILES || files.length > this.MAX_FILES) {
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
  }

  private async deleteFiles(files: Multer.File[]): Promise<void> {
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
