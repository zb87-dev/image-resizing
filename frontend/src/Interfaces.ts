export interface Task {
  taskRequestId: string;
  taskId: string;
  resolution: string;
  taskStatus: ConversionStatus;
  convertedFilePath: string;
  taskCreatedAt: string;
  taskUpdatedAt: string;
  meta?: {
    errorMessage: string;
  };
}

export interface ConversationRequestDetails {
  id: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  fileType: string;
  resolutions: string;
  status: ConversionStatus;
  createdAt: Date;
  tasks: Task[];
}

export enum ConversionStatus {
  PENDING = "pending",
  IN_PROGRESS = "in-progress",
  COMPLETED = "completed",
  FAILED = "failed",
}
