import { useState, useEffect, useRef } from 'react';
import {
  Download,
  Trash2,
  Share2,
  File,
  Image,
  Video,
  Music,
  FileText,
  FileSpreadsheet,
  Archive,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/context';
import { fileService } from '@/services';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { FileUploadDialog } from '@/components/FileUploadDialog';
import { formatFileSize, formatDate, getFileIconName } from '@/lib/formatUtils';
import type { FileData, Pagination } from '@/types';

// Map icon names to Lucide icons
const iconMap: Record<string, LucideIcon> = {
  File,
  Image,
  Video,
  Music,
  FileText,
  FileSpreadsheet,
  Archive,
};

// Get icon component from mime type
function getFileIcon(mimeType: string | null): LucideIcon {
  const iconName = getFileIconName(mimeType);
  return iconMap[iconName] || File;
}

export function FilesPage() {
  const { isAuthenticated } = useAuth();
  const [files, setFiles] = useState<FileData[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(20);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch files
  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    // Cancel previous request nếu có
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    const fetchFiles = async () => {
      try {
        setIsLoading(true);
        setIsFetching(true);
        setError(null);
        
        console.log('[FilesPage] Fetching files - Page:', currentPage, 'Limit:', limit);
        const result = await fileService.list({
          page: currentPage,
          limit: limit,
        });

        // Kiểm tra nếu đã bị cancel
        if (signal.aborted) {
          return;
        }

        console.log('[FilesPage] Files loaded:', {
          count: result.data.length,
          total: result.pagination.total,
          page: result.pagination.page,
          totalPages: result.pagination.totalPages,
        });

        setFiles(result.data);
        setPagination(result.pagination);
      } catch (err) {
        // Không hiển thị error nếu đã bị cancel
        if (signal.aborted) {
          return;
        }

        const errorMessage = err instanceof Error ? err.message : 'Không thể tải danh sách files';
        setError(errorMessage);
        console.error('[FilesPage] Lỗi khi fetch files:', err);
      } finally {
        setIsLoading(false);
        setIsFetching(false);
        abortControllerRef.current = null;
      }
    };

    fetchFiles();

    // Cleanup
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [isAuthenticated, currentPage, limit]);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (pagination && newPage >= 1 && newPage <= pagination.totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Handle upload success - refresh file list
  const handleUploadSuccess = () => {
    // Reset về trang 1 - useEffect sẽ tự động fetch lại
    // Nếu đang ở trang 1, force refresh bằng cách set lại
    if (currentPage === 1) {
      // Trigger re-fetch bằng cách set lại currentPage
      setCurrentPage(0);
      setTimeout(() => setCurrentPage(1), 0);
    } else {
      setCurrentPage(1);
    }
  };

  // Retry fetch files
  const handleRetry = () => {
    setError(null);
    // Trigger re-fetch
    setCurrentPage((prev) => prev);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Files</h1>
        <Button
          onClick={() => setIsUploadDialogOpen(true)}
          className="shadow-md"
        >
          Upload File
        </Button>
      </div>

      {/* Upload Dialog */}
      <FileUploadDialog
        open={isUploadDialogOpen}
        onOpenChange={setIsUploadDialogOpen}
        onUploadSuccess={handleUploadSuccess}
      />

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
          <div className="flex items-center justify-between">
            <span>{error}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetry}
              className="ml-4 shadow-md"
            >
              Thử lại
            </Button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && files.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <p className="text-lg font-medium text-muted-foreground">Chưa có files nào</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Upload file đầu tiên của bạn để bắt đầu
          </p>
          <Button
            className="mt-4 shadow-md"
            onClick={() => setIsUploadDialogOpen(true)}
          >
            Upload File
          </Button>
        </div>
      )}

      {/* Files List */}
      {!isLoading && !error && files.length > 0 && (
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Hiển thị {files.length} / {pagination?.total} files
          </div>
          <div className="rounded-lg border shadow-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%] bg-primary text-primary-foreground">Tên file</TableHead>
                  <TableHead className="w-[15%] bg-primary text-primary-foreground">Kích thước</TableHead>
                  <TableHead className="w-[20%] bg-primary text-primary-foreground">Ngày upload</TableHead>
                  <TableHead className="w-[25%] text-right bg-primary text-primary-foreground">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {files.map((file) => (
                  <TableRow key={file.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {(() => {
                          const IconComponent = getFileIcon(file.mimeType);
                          return <IconComponent className="h-5 w-5 text-muted-foreground flex-shrink-0" />;
                        })()}
                        <span className="truncate" title={file.fileName || file.id}>
                          {file.fileName || `File ${file.id.substring(0, 8)}`}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatFileSize(file.fileSize)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(file.uploadedAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="icon"
                          className="h-8 w-8 shadow-md bg-accent text-accent-foreground hover:bg-accent/90"
                          onClick={() => console.log('Download:', file.id)}
                          title="Download"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          className="h-8 w-8 shadow-md bg-secondary text-secondary-foreground hover:bg-secondary/90"
                          onClick={() => console.log('Share:', file.id)}
                          title="Share"
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          className="h-8 w-8 shadow-md bg-primary text-primary-foreground hover:bg-primary/90"
                          onClick={() => console.log('Delete:', file.id)}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination placeholder */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Trang {pagination.page} / {pagination.totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={!pagination.hasPrevious || isFetching}
                  className="shadow-md"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={!pagination.hasNext || isFetching}
                  className="shadow-md"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

