import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { ConversionService } from './conversion.service';

@Controller('images')
@ApiTags('Images')
export class UploadController {
  constructor(private readonly uploadService: ConversionService) {}

  @Post('upload')
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: 200,
    description: 'Returns value indicating that the upload was successful.',
  })
  public async upload(@Body() payload: any): Promise<any> {
    return this.uploadService.upload();
  }
}
