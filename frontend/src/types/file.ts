// Upload file request
export interface UploadFileRequest {
  encryptedBlob: string; // base64
  iv: string; // base64
  authTag: string; // base64
  fileName?: string | null;
  fileSize: string | number;
  mimeType: string;
}

// File data
export interface FileData {
  id: string;
  fileName: string | null;
  fileSize: string; // BigInt as string
  mimeType: string | null;
  uploadedAt: string;
}

// File detail (getById)
export interface FileDetailData extends FileData {
  encryptedBlob: string; // base64
  iv: string; // base64
  authTag: string; // base64
  encryptedAesKey: string | null; // Cho shared files
}

//query param
export interface FileListQuery {
  page?: number | string;
  limit?: number | string;
}
