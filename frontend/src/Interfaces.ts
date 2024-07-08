export interface Task {
  taskRequestId: string;
  taskId: string;
  resolution: string;
  taskStatus: string;
  convertedFilePath: string;
  taskCreatedAt: string;
  taskUpdatedAt: string;
}

export interface ConversationRequestDetails {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  resolutions: string;
  status: string;
  createdAt: Date;
  tasks: Task[];
}