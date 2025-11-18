import { fileService } from '@/services';
import type { FileDetailData } from '@/types';
import {
  decryptAESKeyWithRSA,
  decryptAES,
  base64ToAESEncrypted,
} from '@/lib/crypto';

export async function downloadFile(
  fileId: string,
  privateKey: CryptoKey,
  fileName?: string | null
): Promise<void> {
  try {
    // Fetch file từ API
    const fileData: FileDetailData = await fileService.getById(fileId);

    if (!fileData.encryptedAesKey) {
      throw new Error('File không có encrypted AES key');
    }

    // Decrypt AES key với RSA private key
    const aesKey = await decryptAESKeyWithRSA(fileData.encryptedAesKey, privateKey);

    // Convert base64 data thành AESEncryptedData format
    const encryptedData = base64ToAESEncrypted({
      encryptedBlob: fileData.encryptedBlob,
      iv: fileData.iv,
      authTag: fileData.authTag,
    });

    // Decrypt file với AES key
    const decryptedBuffer = await decryptAES(encryptedData, aesKey);

    // Tạo blob và trigger download
    const blob = new Blob([decryptedBuffer], { type: fileData.mimeType || 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName || fileData.fileName || `file-${fileId}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Download file thất bại: ${error.message}`);
    }
    throw new Error('Download file thất bại: Lỗi không xác định');
  }
}

