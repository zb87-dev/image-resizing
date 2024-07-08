export enum ConversionStatus {
  PENDING = "pending",
  IN_PROGRESS = "in-progress",
  COMPLETED = "completed",
  FAILED = "failed",
}

export interface ImageProcessingData {
  target: "worker" | "server";
  userId: string;
  requestId: string;
  taskId: string;
  fileName: string;
  resolution: string;
  filePath: string;
  mimeType: string;
}

export enum Target {
  SERVER = "server",
  WORKER = "worker",
}
