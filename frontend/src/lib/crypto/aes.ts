// AES-256-GCM for file encryption
// GCM có auth tag

import { arrayBufferToBase64, base64ToArrayBuffer } from './utils';

export interface AESEncryptedData {
  encrypted: ArrayBuffer;
  iv: Uint8Array; // 12 bytes 
  authTag: Uint8Array; // 16 bytes
}

export interface AESEncryptedDataBase64 {
  encryptedBlob: string; // base64
  iv: string; // base64
  authTag: string; // base64
}

// Random AES-256
export async function generateAESKey(): Promise<CryptoKey> {
  try {
    return await crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256,
      },
      true, //extractable
      ['encrypt', 'decrypt'] //dùng cho
    );
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Không thể tạo AES key: ${error.message}`);
    }
    throw new Error('Không thể tạo AES key: Lỗi không xác định');
  }
}

// Export AES key -> base64
export async function exportAESKey(key: CryptoKey): Promise<string> {
  try {
    const exported = await crypto.subtle.exportKey('raw', key);
    
    // validate 32 bytes
    if (exported.byteLength !== 32) {
      throw new Error(`Kích thước AES key không hợp lệ: cần 32 bytes, nhận được ${exported.byteLength} bytes`);
    }
    
    return arrayBufferToBase64(exported);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Không thể export AES key: ${error.message}`);
    }
    throw new Error('Không thể export AES key: Lỗi không xác định');
  }
}

// Import AES key từ base64 
export async function importAESKey(keyBase64: string): Promise<CryptoKey> {
  try {
    const keyData = base64ToArrayBuffer(keyBase64);
    
    if (keyData.byteLength !== 32) {
      throw new Error(`Kích thước AES key không hợp lệ: cần 32 bytes, nhận được ${keyData.byteLength} bytes`);
    }

    return await crypto.subtle.importKey(
      'raw',
      keyData,
      {
        name: 'AES-GCM',
        length: 256,
      },
      true,
      ['encrypt', 'decrypt'] 
    );
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Không thể import AES key: ${error.message}`);
    }
    throw new Error('Không thể import AES key: Lỗi không xác định');
  }
}

// Mã hóa dữ liệu với AES-GCM
export async function encryptAES(
  data: ArrayBuffer,
  key: CryptoKey
): Promise<AESEncryptedData> {
  if (!data || data.byteLength === 0) {
    throw new Error('Data không thể rỗng');
  }

  try {
    // Gen random IV/Nonce (12 bytes)
    const iv = new Uint8Array(12);
    crypto.getRandomValues(iv);

    // Encrypt
    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
        tagLength: 128, //16 bytes
      },
      key,
      data
    );

    // Lấy ra riêng auth tag (16 bytes cuối)
    const encryptedArray = new Uint8Array(encrypted);
    if (encryptedArray.length < 16) {
      throw new Error('Dữ liệu đã mã hóa quá ngắn (thiếu auth tag)');
    }
    
    const authTag = encryptedArray.slice(-16);
    const encryptedData = encryptedArray.slice(0, -16).buffer;

    return {
      encrypted: encryptedData,
      iv,
      authTag,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Mã hóa AES thất bại: ${error.message}`);
    }
    throw new Error('Mã hóa AES thất bại: Lỗi không xác định');
  }
}

// Decrypt data
export async function decryptAES(
  encryptedData: AESEncryptedData,
  key: CryptoKey
): Promise<ArrayBuffer> {
  
  if (encryptedData.iv.length !== 12) {
    throw new Error(`Kích thước IV không hợp lệ: cần 12 bytes, nhận được ${encryptedData.iv.length} bytes`);
  }
  
  if (encryptedData.authTag.length !== 16) {
    throw new Error(`Kích thước auth tag không hợp lệ: cần 16 bytes, nhận được ${encryptedData.authTag.length} bytes`);
  }

  try {
    // ghép encrypted data và auth tag
    const encryptedArray = new Uint8Array(encryptedData.encrypted);
    const authTagArray = new Uint8Array(encryptedData.authTag);
    const combined = new Uint8Array(encryptedArray.length + authTagArray.length);
    combined.set(encryptedArray);
    combined.set(authTagArray, encryptedArray.length);

    const iv = new Uint8Array(encryptedData.iv);

    // Decrypt
    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
        tagLength: 128,
      },
      key,
      combined.buffer
    );

    return decrypted;
  } catch (error) {
    // Lỗi khi auth tag không hợp lệ hoặc key sai
    if (error instanceof Error) {
      throw new Error(`Giải mã AES thất bại: ${error.message}`);
    }
    throw new Error('Giải mã AES thất bại: Lỗi không xác định');
  }
}

// Chuyển data đã mã hóa thành dạng base64 để truyền đi
export function encryptAESToBase64(
  encryptedData: AESEncryptedData
): AESEncryptedDataBase64 {
  return {
    encryptedBlob: arrayBufferToBase64(encryptedData.encrypted),
    iv: arrayBufferToBase64(encryptedData.iv.buffer as ArrayBuffer),
    authTag: arrayBufferToBase64(encryptedData.authTag.buffer as ArrayBuffer),
  };
}

// Chuyển đổi ngược lại
export function base64ToAESEncrypted(
  data: AESEncryptedDataBase64
): AESEncryptedData {
  const ivBuffer = base64ToArrayBuffer(data.iv);
  const authTagBuffer = base64ToArrayBuffer(data.authTag);
  
  if (ivBuffer.byteLength !== 12) {
    throw new Error(`Kích thước IV không hợp lệ: cần 12 bytes, nhận được ${ivBuffer.byteLength} bytes`);
  }
  
  if (authTagBuffer.byteLength !== 16) {
    throw new Error(`Kích thước auth tag không hợp lệ: cần 16 bytes, nhận được ${authTagBuffer.byteLength} bytes`);
  }
  
  return {
    encrypted: base64ToArrayBuffer(data.encryptedBlob),
    iv: new Uint8Array(ivBuffer),
    authTag: new Uint8Array(authTagBuffer),
  };
}


