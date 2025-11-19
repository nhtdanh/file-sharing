import { useState, useCallback, useRef, useEffect } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { useAuth } from '@/context';
import { fileService } from '@/services';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { toast } from 'react-toastify';
import {
  generateAESKey,
  encryptAES,
  encryptAESToBase64,
  encryptAESKeyWithRSA,
  importPublicKey,
} from '@/lib/crypto';
import { getErrorMessage } from '@/utils/errorUtils';

interface FileUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadSuccess: () => void;
}

// Max file size: 100MB
const MAX_FILE_SIZE = 100 * 1024 * 1024;

// Các type cho phép
const ALLOWED_MIME_TYPES = [
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  'text/markdown',
  'application/json',
  // Images
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/bmp',
  // Archives
  'application/zip',
  'application/x-zip-compressed',
  'application/x-rar-compressed',
  'application/x-7z-compressed',
  'application/x-tar',
  'application/gzip',
  // Video
  'video/mp4',
  'video/mpeg',
  'video/quicktime',
  'video/x-msvideo',
  'video/webm',
  // Audio
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
  'audio/webm',
];

export function FileUploadDialog({
  open,
  onOpenChange,
  onUploadSuccess,
}: FileUploadDialogProps) {
  const { user, isAuthenticated } = useAuth();
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Validate file
  const validateFile = (file: File): string | null => {
    // Kiểm tra file có tồn tại
    if (!file) {
      return 'File không hợp lệ';
    }

    // Kiểm tra file size = 0
    if (file.size === 0) {
      return 'File không thể rỗng';
    }

    // Kiểm tra file size
    if (file.size > MAX_FILE_SIZE) {
      return `File quá lớn. Kích thước tối đa: ${(MAX_FILE_SIZE / (1024 * 1024)).toFixed(0)}MB`;
    }

    // Kiểm tra MIME type
    const isValidMimeType = ALLOWED_MIME_TYPES.includes(file.type);

    if (!isValidMimeType) {
      return 'Loại file không được hỗ trợ';
    }

    return null;
  };

  // Xử lí chọn file
  const handleFileSelect = useCallback((file: File) => {
    const error = validateFile(file);
    if (error) {
      toast.error(error);
      return;
    }

    setSelectedFile(file);
    setUploadProgress(0);
  }, []);

  // Kéo thả
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );


  const handleClose = useCallback(() => {
    if (isUploading) {
      // Cancel upload nếu đang upload
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      setIsUploading(false);
    }
    
    setSelectedFile(null);
    setUploadProgress(0);
    setIsDragging(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    abortControllerRef.current = null;
    onOpenChange(false);
  }, [isUploading, onOpenChange]);

  // Cleanup khi component unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // upload
  const handleUpload = useCallback(async () => {
    if (!selectedFile) {
      return;
    }

    // Kiểm tra authentication
    if (!isAuthenticated || !user) {
      toast.error('Vui lòng đăng nhập để upload file');
      return;
    }

    // Tạo AbortController để có thể cancel
    abortControllerRef.current = new AbortController();

    try {
      setIsUploading(true);
      setUploadProgress(0);

      console.log('[FileUpload] Bắt đầu upload:', {
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        mimeType: selectedFile.type,
      });

      // Đọc file thành ArrayBuffer
      setUploadProgress(10);
      const fileBuffer = await selectedFile.arrayBuffer();
      console.log('[FileUpload] File đã đọc:', fileBuffer.byteLength, 'bytes');

      // Tạo AES key và mã hóa file
      setUploadProgress(20);
      console.log('[FileUpload] Tạo AES key và mã hóa file (client-side)');
      const aesKey = await generateAESKey();
      const encryptedData = await encryptAES(fileBuffer, aesKey);
      const encryptedBase64 = encryptAESToBase64(encryptedData);
      console.log('[FileUpload] File đã được mã hóa');

      // Mã hóa AES key với RSA public key của owner
      setUploadProgress(40);
      if (!user?.publicKey) {
        throw new Error('Không tìm thấy public key. Vui lòng đăng nhập lại.');
      }
      console.log('[FileUpload] Mã hóa AES key với RSA public key của owner');
      const ownerPublicKey = await importPublicKey(user.publicKey);
      const encryptedAesKey = await encryptAESKeyWithRSA(aesKey, ownerPublicKey);
      console.log('[FileUpload] AES key đã được mã hóa với RSA');

      // Chuẩn bị data để upload
      setUploadProgress(60);
      const uploadData = {
        encryptedBlob: encryptedBase64.encryptedBlob,
        iv: encryptedBase64.iv,
        authTag: encryptedBase64.authTag,
        encryptedAesKey,
        fileName: selectedFile.name,
        fileSize: selectedFile.size.toString(),
        mimeType: selectedFile.type,
      };

      console.log('[FileUpload] Gửi request upload');
      setUploadProgress(80);

      // Upload lên server
      const result = await fileService.upload(uploadData);

      // Kiểm tra nếu đã bị cancel
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      console.log('[FileUpload] Upload thành công:', result.id);
      setUploadProgress(100);

      toast.success('Upload file thành công');
      
      // Reset state trước khi close
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      onUploadSuccess();
      onOpenChange(false);
    } catch (error) {
      // Không hiển thị error nếu đã bị cancel
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }
      
      console.error('[FileUpload] Lỗi khi upload:', error);
      toast.error(getErrorMessage(error, 'Upload file thất bại'));
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
      abortControllerRef.current = null;
    }
  }, [selectedFile, user, isAuthenticated, onUploadSuccess, onOpenChange]);


  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Upload File</DialogTitle>
          <DialogDescription>
            Chọn file để upload. File sẽ được mã hóa trước khi gửi lên server.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Drag and Drop Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {selectedFile ? (
              <div className="space-y-2">
                <p className="font-medium">{selectedFile.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedFile(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  disabled={isUploading}
                  className="shadow-md"
                >
                  Xóa
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">
                    Kéo thả file vào đây hoặc
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="mt-2 shadow-md"
                  >
                    Chọn file
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Tối đa {(MAX_FILE_SIZE / (1024 * 1024)).toFixed(0)}MB
                </p>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileInputChange}
              disabled={isUploading}
            />
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Đang upload...</span>
                <span className="font-medium">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isUploading}
            className="shadow-md"
          >
            Hủy
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className="shadow-md"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang upload...
              </>
            ) : (
              'Upload'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

