//RSA-4096-OAEP để mã hóa AES key

import { arrayBufferToBase64, base64ToArrayBuffer } from './utils';

//Mã hóa AES key
export async function encryptRSA(
  data: ArrayBuffer,
  publicKey: CryptoKey
): Promise<ArrayBuffer> {
  // RSA-4096-OAEP có thể mã hóa tối đa ~446 bytes
  if (data.byteLength > 446) {
    throw new Error('Data quá lớn cho mã hóa RSA-4096-OAEP (tối đa 446 bytes)');
  }
  
  try {
    return await crypto.subtle.encrypt(
      {
        name: 'RSA-OAEP',
      },
      publicKey,
      data
    );
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Mã hóa RSA thất bại: ${error.message}`);
    }
    throw new Error('Mã hóa RSA thất bại: Lỗi không xác định');
  }
}

// Decrypt RSA với private key
export async function decryptRSA(
  encryptedData: ArrayBuffer,
  privateKey: CryptoKey
): Promise<ArrayBuffer> {
  try {
    return await crypto.subtle.decrypt(
      {
        name: 'RSA-OAEP',
      },
      privateKey,
      encryptedData
    );
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Giải mã RSA thất bại: ${error.message}`);
    }
    throw new Error('Giải mã RSA thất bại: Lỗi không xác định');
  }
}

// Encrypt AES key với public key của người nhận
export async function encryptAESKeyWithRSA(
  aesKey: CryptoKey,
  recipientPublicKey: CryptoKey
): Promise<string> {
  try {
    // Export AES key thành raw format (32 bytes for AES-256)
    const exportedKey = await crypto.subtle.exportKey('raw', aesKey);
    
    if (exportedKey.byteLength !== 32) {
      throw new Error(`Kích thước AES key không hợp lệ: cần 32 bytes, nhận được ${exportedKey.byteLength} bytes`);
    }
    
    // Mã hóa với RSA-OAEP
    const encrypted = await encryptRSA(exportedKey, recipientPublicKey);
    
    // chuyển đổi thành base64
    return arrayBufferToBase64(encrypted);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Không thể mã hóa AES key với RSA: ${error.message}`);
    }
    throw new Error('Không thể mã hóa AES key với RSA: Lỗi không xác định');
  }
}

// Decrypt AES key với private key (truy cập file được chia sẻ)
export async function decryptAESKeyWithRSA(
  encryptedAESKeyBase64: string,
  privateKey: CryptoKey
): Promise<CryptoKey> {
  try {
    const encrypted = base64ToArrayBuffer(encryptedAESKeyBase64);
    
    const decrypted = await decryptRSA(encrypted, privateKey);
    
    if (decrypted.byteLength !== 32) {
      throw new Error(`Kích thước AES key đã giải mã không hợp lệ: cần 32 bytes, nhận được ${decrypted.byteLength} bytes`);
    }
    
    return crypto.subtle.importKey(
      'raw',
      decrypted,
      {
        name: 'AES-GCM',
        length: 256,
      },
      true,
      ['encrypt', 'decrypt'] 
    );
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Không thể giải mã AES key với RSA: ${error.message}`);
    }
    throw new Error('Không thể giải mã AES key với RSA: Lỗi không xác định');
  }
}


