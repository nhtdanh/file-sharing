// Share file request
export interface ShareFileRequest {
  sharedToUserId: string; // UUID
  encryptedAesKey: string;
  canDownload?: boolean;
  canReshare?: boolean;
}

// Share file response (không trả về encryptedAesKey vì client đã có)
export interface ShareFileResponse {
  id: number;
  fileId: string;
  sharedToUserId: string;
  canDownload: boolean;
  canReshare: boolean;
  sharedById: string | null;
  sharedAt: string;
}

// Share file data - files được share cho user (getSharedFiles)
export interface SharedFileData {
  id: number;
  fileId: string;
  sharedToUserId: string;
  encryptedAesKey: string;
  canDownload: boolean;
  canReshare: boolean;
  sharedById: string | null;
  sharedAt: string;
  file: {
    id: string;
    fileName: string | null;
    fileSize: string; // BigInt as string
    mimeType: string | null;
    uploadedAt: string;
  };
  sharedByUser: {
    id: string;
    username: string;
  } | null;
}

// File share data  (từ getFileShares endpoint)
export interface FileShareData {
  id: number;
  fileId: string;
  sharedToUserId: string;
  encryptedAesKey: string;
  canDownload: boolean;
  canReshare: boolean;
  sharedById: string | null;
  sharedAt: string;
  sharedToUser: {
    id: string;
    username: string;
  };
}

// Unshare file 
export interface UnshareFileRequest {
  sharedToUserId: string; // UUID
}

// query param
export interface SharedFilesQuery {
  page?: number | string;
  limit?: number | string;
  search?: string;
  sortBy?: 'name' | 'size' | 'date';
  sortOrder?: 'asc' | 'desc';
  categoryFilter?: string; // 'image', 'video', 'audio', 'document', 'archive'
}
