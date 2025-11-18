import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface DeleteFileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileName: string | null;
  onConfirm: () => void;
  isDeleting?: boolean;
}

export function DeleteFileDialog({
  open,
  onOpenChange,
  fileName,
  onConfirm,
  isDeleting = false,
}: DeleteFileDialogProps) {
  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Xóa file</DialogTitle>
          <DialogDescription>
            Bạn có chắc chắn muốn xóa file "{fileName || 'này'}"? Hành động này không thể hoàn tác.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Hủy
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isDeleting}
          >
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Xóa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

