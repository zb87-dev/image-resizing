export enum ConversionStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in-progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
}
export enum Target {
  SERVER = 'server',
  WORKER = 'worker',
}

export interface ConversionUpdate {
  target: Target;
  userId: string;
  requestId: string;
  taskId: string;
  fileName: string;
  resolution: string;
  filePath: string;
  mimeType: string;
  convertedFilePath: string;
  status: ConversionStatus;
  errorMessage?: string;
}
