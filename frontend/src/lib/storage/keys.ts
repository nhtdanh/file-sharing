// Private key được decrypt từ encryptedPrivateKey + password
// Lưu trong sessionStorage (mất khi đóng tab) để an toàn hơn localStorage
// Format: privateKey là base64 string (sau khi export từ CryptoKey)

const PRIVATE_KEY_KEY = 'private_key';
const SALT_KEY = 'salt';

export const keysStorage = {
  // Lưu private key (base64 string, đã export từ CryptoKey) và salt
  set(privateKey: string, salt: string): void {
    if (typeof window === 'undefined') return;
    try {
      // Lưu trong sessionStorage 
      sessionStorage.setItem(PRIVATE_KEY_KEY, privateKey);
      sessionStorage.setItem(SALT_KEY, salt);
    } catch {
      // 
    }
  },

  // Lấy private key (base64 string, cần import lại thành CryptoKey để dùng)
  getPrivateKey(): string | null {
    if (typeof window === 'undefined') return null;
    try {
      return sessionStorage.getItem(PRIVATE_KEY_KEY);
    } catch {
      return null;
    }
  },

  // Lấy salt
  getSalt(): string | null {
    if (typeof window === 'undefined') return null;
    try {
      return sessionStorage.getItem(SALT_KEY);
    } catch {
      return null;
    }
  },

  // Xóa private key và salt
  clear(): void {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.removeItem(PRIVATE_KEY_KEY);
      sessionStorage.removeItem(SALT_KEY);
    } catch {
      // 
    }
  },

  // Kiểm tra có private key không
  has(): boolean {
    return this.getPrivateKey() !== null;
  },
};

