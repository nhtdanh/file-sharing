import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { shareService } from '@/services';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import type { FileShareData } from '@/types';
import { formatDate } from '@/utils/formatUtils';
import { getErrorMessage } from '@/utils/errorUtils';

interface FileSharesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileId: string;
  fileName: string | null;
}

export function FileSharesDialog({ open, onOpenChange, fileId, fileName }: FileSharesDialogProps) {
  const [shares, setShares] = useState<FileShareData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUnsharingId, setIsUnsharingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchShares = useCallback(async () => {
    if (!fileId) return;
    try {
      setIsLoading(true);
      setError(null);
      const result = await shareService.getFileShares(fileId);
      setShares(result);
    } catch (err) {
      const message = getErrorMessage(err, 'Không thể tải danh sách share');
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [fileId]);

  useEffect(() => {
    if (open) {
      fetchShares();
    } else {
      setShares([]);
      setError(null);
      setIsLoading(false);
      setIsUnsharingId(null);
    }
  }, [open, fetchShares]);

  const handleUnshare = async (sharedToUserId: string) => {
    try {
      setIsUnsharingId(sharedToUserId);
      await shareService.unshare(fileId, { sharedToUserId });
      toast.success('Đã hủy share');
      setShares((prev) => prev.filter((share) => share.sharedToUserId !== sharedToUserId));
    } catch (err) {
      toast.error(getErrorMessage(err, 'Hủy share thất bại'));
    } finally {
      setIsUnsharingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Danh sách user đã share</DialogTitle>
          <DialogDescription>
            File: {fileName || 'Không có tên'} — đang share cho {shares.length} người
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, idx) => (
              <Skeleton key={idx} className="h-12 w-full" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        ) : shares.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            Chưa share file này cho ai
          </div>
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="bg-muted text-muted-foreground font-bold">User</TableHead>
        
                  <TableHead className="bg-muted text-muted-foreground font-bold">Ngày share</TableHead>
                  <TableHead className="bg-muted text-muted-foreground font-bold text-right">
                    Hành động
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shares.map((share) => (
                  <TableRow key={share.id}>
                    <TableCell className="font-medium">
                      {share.sharedToUser.username}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(share.sharedAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-primary border-black text-white hover:bg-ring hover:text-destructive-foreground hover:border-destructive"
                        onClick={() => handleUnshare(share.sharedToUserId)}
                        disabled={isUnsharingId === share.sharedToUserId}
                      >
                        {isUnsharingId === share.sharedToUserId ? 'Đang hủy...' : 'Hủy share'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


