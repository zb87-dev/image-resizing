import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class UploadService {
  constructor(private readonly logger: Logger) {}

  public async upload(): Promise<any> {
    return { success: true };
  }
}
