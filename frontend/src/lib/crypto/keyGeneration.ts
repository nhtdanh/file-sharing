// RSA-4096

import { arrayBufferToBase64, base64ToArrayBuffer } from './utils';

export interface RSAKeyPair {
  publicKey: CryptoKey;
  privateKey: CryptoKey;
}

export interface RSAKeyPairExport {
  publicKey: string; //  SPKI
  privateKey: string; // PKCS#8
}

// Tạo cặp khóa
export async function generateRSAKeyPair(): Promise<RSAKeyPair> {
  try {
    const keyPair = await crypto.subtle.generateKey(
      {
        name: 'RSA-OAEP',
        modulusLength: 4096,
        publicExponent: new Uint8Array([1, 0, 1]), // 65537
        hash: 'SHA-256',
      },
      true, 
      ['encrypt', 'decrypt'] 
    );

    return {
      publicKey: keyPair.publicKey,
      privateKey: keyPair.privateKey,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Không thể tạo RSA keypair: ${error.message}`);
    }
    throw new Error('Không thể tạo RSA keypair: Lỗi không xác định');
  }
}

// Export public key thành base64 (SPKI format)
export async function exportPublicKey(publicKey: CryptoKey): Promise<string> {
  try {
    const exported = await crypto.subtle.exportKey('spki', publicKey);
    return arrayBufferToBase64(exported);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Không thể export public key: ${error.message}`);
    }
    throw new Error('Không thể export public key: Lỗi không xác định');
  }
}

// Export private key thành dạng base64 (PKCS#8 format)
export async function exportPrivateKey(privateKey: CryptoKey): Promise<string> {
  try {
    const exported = await crypto.subtle.exportKey('pkcs8', privateKey);
    return arrayBufferToBase64(exported);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Không thể export private key: ${error.message}`);
    }
    throw new Error('Không thể export private key: Lỗi không xác định');
  }
}

// Import public key 
export async function importPublicKey(publicKeyBase64: string): Promise<CryptoKey> {
  try {
    const keyData = base64ToArrayBuffer(publicKeyBase64);

    return await crypto.subtle.importKey(
      'spki',
      keyData,
      {
        name: 'RSA-OAEP',
        hash: 'SHA-256',
      },
      true, 
      ['encrypt'] //chỉ mã hóa
    );
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Không thể import public key: ${error.message}`);
    }
    throw new Error('Không thể import public key: Lỗi không xác định');
  }
}

// Import private key 
export async function importPrivateKey(privateKeyBase64: string): Promise<CryptoKey> {
  try {
    const keyData = base64ToArrayBuffer(privateKeyBase64);

    return await crypto.subtle.importKey(
      'pkcs8',
      keyData,
      {
        name: 'RSA-OAEP',
        hash: 'SHA-256',
      },
      true, 
      ['decrypt'] //chỉ giải mã
    );
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Không thể import private key: ${error.message}`);
    }
    throw new Error('Không thể import private key: Lỗi không xác định');
  }
}

// Tạo và export RSA keypair(trong quá trình đăng kí)
export async function generateAndExportKeyPair(): Promise<RSAKeyPairExport> {
  const keyPair = await generateRSAKeyPair();
  const [publicKey, privateKey] = await Promise.all([
    exportPublicKey(keyPair.publicKey),
    exportPrivateKey(keyPair.privateKey),
  ]);

  return { publicKey, privateKey };
}

