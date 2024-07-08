import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  Param,
  Post,
  Query,
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

@Controller('conversion')
@ApiTags('Conversion')
export class ConversionController {
  private readonly MIN_FILES = 1;
  private readonly MAX_FILES = 5;
  private readonly SUPPORTED_FILE_TYPES = ['image/jpeg', 'image/png'];
  private readonly TEMP_FOLDER = join(__dirname, '.', 'tempUploads');

  constructor(private readonly conversionService: ConversionService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiResponse({
    status: 201,
    description: 'Returns value indicating that the conversion request is created successfully',
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
  public async create(@Body('userId') userId: string, @UploadedFiles() files: Multer.File[]) {
    this.validateFiles(files);
    const result = await this.conversionService.create(userId, files);
    if (!result) {
      throw new InternalServerErrorException(`Failed to upload files. Please try again later.`);
    }

    this.deleteFiles(files);
    return result;
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: 20,
    description: 'Returns the list of conversion requests for the specified user',
  })
  public async getConversionRequests(@Query('userId') userId: string) {
    return this.conversionService.getConversionRequests(userId);
  }

  @Post(`:conversionId/start`)
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: 20,
    description: 'Returns the list of conversion requests for the specified user',
  })
  public async startConversion(
    @Param('conversionId') conversionId: string,
    @Body('resolutions') resolutions: string[],
    @Body('userId') userId: string,
  ) {
    const conversion = await this.conversionService.startConversion(
      userId,
      conversionId,
      resolutions,
    );
    return conversion;
  }

  private validateFiles(files: Multer.File[]): void {
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
