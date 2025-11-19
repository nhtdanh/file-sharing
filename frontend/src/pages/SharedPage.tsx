import { useState, useEffect, useRef } from 'react';
import { Download, UserRound, Search, ArrowUp, ArrowDown } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '@/context';
import { shareService } from '@/services';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDate, formatFileSize, getFileIconName } from '@/utils/formatUtils';
import { downloadFile } from '@/utils/fileUtils';
import { getErrorMessage } from '@/utils/errorUtils';
import type { SharedFileData, Pagination } from '@/types';
import {
  File,
  FileText,
  FileSpreadsheet,
  Archive,
  Image,
  Video,
  Music,
  type LucideIcon,
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  File,
  Image,
  Video,
  Music,
  FileText,
  FileSpreadsheet,
  Archive,
};

function getFileIcon(mimeType: string | null): LucideIcon {
  const iconName = getFileIconName(mimeType);
  return iconMap[iconName] || File;
}

export function SharedPage() {
  const { isAuthenticated, getPrivateKey } = useAuth();
  const [sharedFiles, setSharedFiles] = useState<SharedFileData[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);
  const [isFetching, setIsFetching] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'size' | 'date'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const abortControllerRef = useRef<AbortController | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce search query
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      // Reset về trang 1 khi search thay đổi
      setCurrentPage(1);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    const { signal } = controller;

    const fetchSharedFiles = async () => {
      try {
        setIsLoading(true);
        setIsFetching(true);
        setError(null);

        console.log('[SharedPage] Fetching shared files - Page:', currentPage, 'Limit:', limit, 'Search:', debouncedSearch, 'Sort:', sortBy, sortOrder, 'Filter:', categoryFilter);
        const result = await shareService.getSharedFiles({
          page: currentPage,
          limit,
          search: debouncedSearch || undefined,
          sortBy,
          sortOrder,
          categoryFilter: categoryFilter || undefined,
        });

        if (signal.aborted) {
          return;
        }

        console.log('[SharedPage] Shared files loaded:', {
          count: result.data.length,
          total: result.pagination.total,
        });

        setSharedFiles(result.data);
        setPagination(result.pagination);
      } catch (err) {
        if (signal.aborted) {
          return;
        }

        const errorMessage = err instanceof Error ? err.message : 'Không thể tải danh sách files được share';
        setError(errorMessage);
        console.error('[SharedPage] Lỗi khi fetch shared files:', err);
      } finally {
        setIsLoading(false);
        setIsFetching(false);
        abortControllerRef.current = null;
      }
    };

    fetchSharedFiles();

    return () => {
      controller.abort();
    };
  }, [isAuthenticated, currentPage, limit, debouncedSearch, sortBy, sortOrder, categoryFilter]);

  const handlePageChange = (newPage: number) => {
    if (pagination && newPage >= 1 && newPage <= pagination.totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleRetry = () => {
    setError(null);
    setCurrentPage((prev) => prev);
  };

  const handleDownload = async (share: SharedFileData) => {
    if (!share.canDownload) {
      toast.error('Bạn không có quyền download file này');
      return;
    }

    try {
      setDownloadingId(share.fileId);
      const privateKey = await getPrivateKey();
      if (!privateKey) {
        toast.error('Không tìm thấy private key. Vui lòng đăng nhập lại.');
        return;
      }

      await downloadFile(share.fileId, privateKey, share.file.fileName);
    } catch (error) {
      console.error('[SharedPage] Download error:', error);
      toast.error(getErrorMessage(error, 'Download file thất bại'));
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between -mt-2">
        <h1 className="text-xl font-bold bg-secondary text-secondary-foreground px-6 py-2 rounded-full shadow-xs">
          Shared With Me
        </h1>
      </div>

      {/* Search, Sort và Filter - hiển thị khi có file hoặc đang có search/filter */}
      {pagination && (pagination.total > 0 || debouncedSearch || categoryFilter) && (
        <div className="flex items-center gap-3">
          {/* Search Bar */}
          <div className="relative w-full max-w-xs flex-shrink-0">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Nhập tên file..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Filter và Sort */}
          <div className="flex items-center gap-2 ml-auto">
            {/* Filter by Category */}
            <Select value={categoryFilter || 'all'} onValueChange={(value: string) => {
              setCategoryFilter(value === 'all' ? '' : value);
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Loại file" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="image">Hình ảnh</SelectItem>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="audio">Audio</SelectItem>
                <SelectItem value="document">Tài liệu</SelectItem>
                <SelectItem value="archive">Tệp nén</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort By */}
            <Select value={sortBy} onValueChange={(value: 'name' | 'size' | 'date') => {
              setSortBy(value);
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Sắp xếp" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Ngày share</SelectItem>
                <SelectItem value="name">Tên file</SelectItem>
                <SelectItem value="size">Kích thước</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort Order*/}
            <Button
              variant="outline"
              size="icon"
              className="w-9 h-9"
              onClick={() => {
                setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                setCurrentPage(1);
              }}
              title={sortOrder === 'asc' ? 'Tăng dần' : 'Giảm dần'}
            >
              {sortOrder === 'asc' ? (
                <ArrowUp className="h-4 w-4" />
              ) : (
                <ArrowDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="space-y-4">
          {[...Array(5)].map((_, idx) => (
            <Skeleton key={idx} className="h-16 w-full" />
          ))}
        </div>
      )}

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

      {!isLoading && !error && sharedFiles.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          {debouncedSearch || categoryFilter ? (
            <>
              <p className="text-lg font-medium text-muted-foreground">Không tìm thấy file nào phù hợp</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {debouncedSearch && categoryFilter
                  ? `Không có file nào khớp với "${debouncedSearch}" và loại file đã chọn`
                  : debouncedSearch
                  ? `Không có file nào khớp với "${debouncedSearch}"`
                  : 'Không có file nào thuộc loại đã chọn'}
              </p>
            </>
          ) : (
            <>
              <p className="text-lg font-medium text-muted-foreground">Chưa có file nào được share cho bạn</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Khi người khác share file, bạn sẽ thấy chúng ở đây
              </p>
            </>
          )}
        </div>
      )}

      {!isLoading && !error && sharedFiles.length > 0 && (
        <div className="space-y-4">
          <div className="rounded-lg border shadow-md w-full">
            <Table className="w-full">
              <TableHeader>
                        <TableRow>
                          <TableHead className="w-[40%] bg-muted text-muted-foreground font-bold">Tên file</TableHead>
                          <TableHead className="w-[20%] bg-muted text-muted-foreground font-bold">Người share</TableHead>
                          <TableHead className="w-[20%] bg-muted text-muted-foreground font-bold">Ngày share</TableHead>
                          <TableHead className="w-[20%] bg-muted text-muted-foreground font-bold text-right">
                            Thao tác
                          </TableHead>
                        </TableRow>
              </TableHeader>
              <TableBody>
                {sharedFiles.map((share) => (
                  <TableRow key={share.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {(() => {
                          const IconComponent = getFileIcon(share.file.mimeType);
                          return <IconComponent className="h-5 w-5 text-muted-foreground flex-shrink-0" />;
                        })()}
                        <div className="flex flex-col">
                          <span className="truncate" title={share.file.fileName || share.fileId}>
                            {share.file.fileName || `File ${share.fileId.substring(0, 8)}`}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {formatFileSize(share.file.fileSize)}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <UserRound className="h-4 w-4" />
                        <span>{share.sharedByUser?.username || 'Không xác định'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(share.sharedAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8 shadow-none bg-white border-black text-black hover:bg-accent hover:text-accent-foreground hover:border-accent disabled:cursor-not-allowed"
                        onClick={() => handleDownload(share)}
                        disabled={downloadingId === share.fileId || !share.canDownload}
                        title={share.canDownload ? 'Download' : 'Không được phép download'}
                      >
                        {downloadingId === share.fileId ? (
                          <Download className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

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


