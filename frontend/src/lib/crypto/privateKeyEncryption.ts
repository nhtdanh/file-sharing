// Private Key Encryption/Decryption - Encrypt/decrypt RSA private key with với khóa AES được dẫn xuất (Wrapping Key)
// Đăng kí và Đăng nhập

import { deriveKeyFromPassword, generateSalt } from './scrypt';
import { encryptAES, decryptAES, encryptAESToBase64, base64ToAESEncrypted } from './aes';
import { importPrivateKey } from './keyGeneration';
import { arrayBufferToBase64 } from './utils';

// Encrypt private key với password (đăng kí)
export async function encryptPrivateKeyWithPassword(
  privateKey: CryptoKey,
  password: string
): Promise<{ encryptedPrivateKey: string; salt: string }> {

  if (!password || password.length === 0) {
    throw new Error('Password không thể rỗng');
  }

  try {
    //salt để ngăn chặn chosen plaintext (password)
    const salt = generateSalt();

    //dẫn xuất khóa từ password và salt
    const derivedKey = await deriveKeyFromPassword(password, salt);

    // Export private key thành ArrayBuffer
    const exportedKey = await crypto.subtle.exportKey('pkcs8', privateKey);

    // Encrypt private key với khóa dẫn xuất (Wrapping key)
    const encrypted = await encryptAES(exportedKey, derivedKey);

    //chuyển đổi thành base64
    const encryptedBase64 = encryptAESToBase64(encrypted);

    return {
      encryptedPrivateKey: encryptedBase64.encryptedBlob + '|' + encryptedBase64.iv + '|' + encryptedBase64.authTag,
      salt,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Không thể mã hóa private key: ${error.message}`);
    }
    throw new Error('Không thể mã hóa private key: Lỗi không xác định');
  }
}

// Decrypt private key với password (đăng nhập)
// Format: "encrypted|iv|authTag"
export async function decryptPrivateKeyWithPassword(
  encryptedPrivateKey: string,
  password: string,
  salt: string
): Promise<CryptoKey> {
  // 64 hex chars = 32 bytes
  if (!salt || salt.length !== 64 || !/^[0-9a-fA-F]{64}$/.test(salt)) {
    throw new Error('Định dạng salt không hợp lệ');
  }

  if (!password || password.length === 0) {
    throw new Error('Password không thể rỗng');
  }

  const parts = encryptedPrivateKey.split('|');
  if (parts.length !== 3) {
    throw new Error('Định dạng của encrypted private key không hợp lệ');
  }

  try {
    const encryptedData = base64ToAESEncrypted({
      encryptedBlob: parts[0],
      iv: parts[1],
      authTag: parts[2],
    });

    // Từ password và salt tạo lại wrapping key
    const derivedKey = await deriveKeyFromPassword(password, salt);

    // Decrypt private key
    const decryptedKey = await decryptAES(encryptedData, derivedKey);

    return importPrivateKey(arrayBufferToBase64(decryptedKey));
  } catch (error) {
    // sai password
    if (error instanceof Error) {
      throw new Error(`Không thể giải mã private key: ${error.message}`);
    }
    throw new Error('Không thể giải mã private key: Lỗi không xác định');
  }
}

