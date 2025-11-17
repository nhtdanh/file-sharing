// Scrypt 
// Dùng để mã hóa/giải mã private key

import { arrayBufferToHex, hexToArrayBuffer } from './utils';

// Scrypt N: CPU/memory cost (2^15 = 32768), r: Block size (8), p: Parallelization (1)

const SCRYPT_PARAMS = {
  name: 'PBKDF2', // PBKDF2 với SHA-256 (thay thế cho Scrypt vì Web Crypto không có sẵn)
  iterations: 100000, 
  hash: 'SHA-256',
};

// Dẫn xuất khóa PBKDF2 
export async function deriveKeyFromPassword(
  password: string,
  salt: string
): Promise<CryptoKey> {

  if (!salt || salt.length !== 64 || !/^[0-9a-fA-F]{64}$/.test(salt)) {
    throw new Error('Định dạng salt không hợp lệ: phải có 64 ký tự hex');
  }

  const passwordBuffer = new TextEncoder().encode(password);

  const saltBuffer = hexToArrayBuffer(salt);

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  // Dẫn xuất khóa PBKDF2
  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: SCRYPT_PARAMS.iterations,
      hash: SCRYPT_PARAMS.hash,
    },
    keyMaterial,
    {
      name: 'AES-GCM',
      length: 256,
    },
    true, 
    ['encrypt', 'decrypt'] 
  );

  return derivedKey;
}

// random salt (32 bytes)
export function generateSalt(): string {
  const saltBytes = new Uint8Array(32);
  crypto.getRandomValues(saltBytes);
  return arrayBufferToHex(saltBytes.buffer);
}


