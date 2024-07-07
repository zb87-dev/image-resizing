export interface MessageData {
  ReceiptHandle?: string;
  Body?: string;
}

export interface ImageProcessingData {
  userId: string;
  requestId: string;
  taskId: string;
  fileName: string;
  resolution: string;
  filePath: string;
  mimeType: string;
}
