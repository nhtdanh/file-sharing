import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Loader2, User, X } from 'lucide-react';
import { useAuth } from '@/context';
import { userService, shareService, fileService } from '@/services';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'react-toastify';
import {
  decryptAESKeyWithRSA,
  encryptAESKeyWithRSA,
  importPublicKey,
} from '@/lib/crypto';
import { getErrorMessage } from '@/utils/errorUtils';
import type { UserSearchResult } from '@/types';

interface ShareFileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileId: string;
  fileName: string | null;
  onShareSuccess?: () => void;
}

export function ShareFileDialog({
  open,
  onOpenChange,
  fileId,
  fileName,
  onShareSuccess,
}: ShareFileDialogProps) {
  const { getPrivateKey, user: currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<UserSearchResult[]>([]);
  const [isSharing, setIsSharing] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Reset results nếu như query rỗng
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      try {
        setIsSearching(true);
        const results = await userService.search({
          username: searchQuery.trim(),
          limit: 10,
        });

        if (signal.aborted) {
          return;
        }

        // Loại bỏ current user và các users đã chọn khỏi kết quả
        const filteredResults = results.filter(
          (user) => 
            user.id !== currentUser?.userId && 
            !selectedUsers.some(selected => selected.id === user.id)
        );

        setSearchResults(filteredResults);
      } catch (error) {
        // Không hiển thị error nếu đã bị cancel
        if (signal.aborted) {
          return;
        }

        console.error('[ShareFileDialog] Lỗi khi search users:', error);
        // Không hiển thị toast cho search errors, chỉ log
      } finally {
        if (!signal.aborted) {
          setIsSearching(false);
        }
      }
    }, 300); //300ms 

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, currentUser?.userId, selectedUsers]);

  // Reset state khi dialog đóng
  useEffect(() => {
    if (!open) {
      setSearchQuery('');
      setSearchResults([]);
      setSelectedUsers([]);
      
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    }
  }, [open]);

  // Handle add user to selected list
  const handleAddUser = useCallback((user: UserSearchResult) => {
    // Kiểm tra xem user đã được chọn chưa
    if (selectedUsers.some(selected => selected.id === user.id)) {
      return;
    }
    
    // Thêm user vào danh sách đã chọn
    setSelectedUsers(prev => [...prev, user]);
    
    setSearchQuery('');
    setSearchResults([]);
  }, [selectedUsers]);

  const handleRemoveUser = useCallback((userId: string) => {
    setSelectedUsers(prev => prev.filter(user => user.id !== userId));
  }, []);

  const handleShare = useCallback(async () => {
    if (selectedUsers.length === 0) {
      toast.error('Vui lòng chọn ít nhất một user để share');
      return;
    }

    if (!currentUser) {
      toast.error('Vui lòng đăng nhập lại');
      return;
    }

    try {
      setIsSharing(true);

      console.log('[ShareFile] Bắt đầu share file:', {
        fileId,
        fileName,
        selectedUsersCount: selectedUsers.length,
      });

      // B1: lấy file detail để có encryptedAesKey (của người share)
      console.log('[ShareFile] Bước 1: Fetch file detail để lấy encryptedAesKey');
      const fileDetail = await fileService.getById(fileId);

      if (!fileDetail.encryptedAesKey) {
        throw new Error('File không có encrypted AES key');
      }

      console.log('[ShareFile] File detail đã lấy được');

      // B2: Decrypt AES key với private key của owner
      console.log('[ShareFile] Bước 2: Decrypt AES key với private key của owner');
      const privateKey = await getPrivateKey();
      if (!privateKey) {
        throw new Error('Không tìm thấy private key. Vui lòng đăng nhập lại.');
      }

      const aesKey = await decryptAESKeyWithRSA(fileDetail.encryptedAesKey, privateKey);
      console.log('[ShareFile] AES key đã được decrypt');

      // Bước 3 đến 5: Share cho từng user
      const sharePromises = selectedUsers.map(async (user) => {
        console.log(`[ShareFile] Đang share cho ${user.username}...`);

        // B3: Import public key của recipient
        const recipientPublicKey = await importPublicKey(user.publicKey);

        // B4: Encrypt AES key với RSA public key của recipient
        const encryptedAesKeyForRecipient = await encryptAESKeyWithRSA(
          aesKey,
          recipientPublicKey
        );

        // B5: Gửi lên server
        await shareService.share(fileId, {
          sharedToUserId: user.id,
          encryptedAesKey: encryptedAesKeyForRecipient,
          canDownload: true, // Luôn true
        });

        console.log(`[ShareFile] Đã share cho ${user.username}`);
      });

      await Promise.all(sharePromises);

      console.log('[ShareFile] Share thành công cho tất cả users');
      toast.success('Đã share file thành công');

      //Reset
      setSearchQuery('');
      setSearchResults([]);
      setSelectedUsers([]);
      onOpenChange(false);
      if (onShareSuccess) {
        onShareSuccess();
      }
    } catch (error) {
      console.error('[ShareFile] Lỗi:', error);
      toast.error(getErrorMessage(error, 'Share file thất bại'));
    } finally {
      setIsSharing(false);
    }
  }, [selectedUsers, fileId, fileName, currentUser, getPrivateKey, onOpenChange, onShareSuccess]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Share File</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4 overflow-y-auto flex-1 min-h-0 custom-scrollbar">
          {/* User Search */}
          <div className="space-y-2">
            <Label htmlFor="user-search">Bạn muốn chia sẻ file này với ai?</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="user-search"
                type="text"
                placeholder="Nhập username để tìm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={isSharing}
                className="pl-9"
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
              )}
            </div>
          </div>

          {/* Search Results */}
          {searchQuery.trim() && (
            <div className="space-y-2">
              {searchResults.length > 0 ? (
                <div className="max-h-48 space-y-1 overflow-y-auto rounded-md border p-2 custom-scrollbar">
                  {searchResults.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => handleAddUser(user)}
                      disabled={isSharing}
                      className="w-full rounded-md p-2 text-left transition-colors hover:bg-muted"
                    >
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span className="font-medium">{user.username}</span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : !isSearching && searchQuery.trim() ? (
                <p className="text-sm text-muted-foreground">
                  Không tìm thấy user nào
                </p>
              ) : null}
            </div>
          )}

          {/* Selected Users */}
          {selectedUsers.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Đã chọn ({selectedUsers.length}):
              </Label>
              <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
                {selectedUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between rounded-md border bg-muted/50 p-2"
                  >
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm">{user.username}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => handleRemoveUser(user.id)}
                      disabled={isSharing}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSharing}
          >
            Hủy
          </Button>
          <Button
            variant="secondary"
            className="shadow-md hover:shadow-lg transition-shadow"
            onClick={handleShare}
            disabled={selectedUsers.length === 0 || isSharing}
          >
            {isSharing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Share {selectedUsers.length > 0 && `(${selectedUsers.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

