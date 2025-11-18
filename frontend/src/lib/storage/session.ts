// Session storage - userId, username, publicKey

const USER_ID_KEY = 'user_id';
const USERNAME_KEY = 'username';
const PUBLIC_KEY_KEY = 'public_key';

export interface SessionData {
  userId: string;
  username: string;
  publicKey?: string; // Optional vì có thể không có khi load từ storage cũ
}

export const userSessionStorage = {

  set(data: SessionData): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(USER_ID_KEY, data.userId);
      localStorage.setItem(USERNAME_KEY, data.username);
      if (data.publicKey) {
        localStorage.setItem(PUBLIC_KEY_KEY, data.publicKey);
      }
    } catch {
      // 
    }
  },

  // Lấy session data
  get(): SessionData | null {
    if (typeof window === 'undefined') return null;
    try {
      const userId = localStorage.getItem(USER_ID_KEY);
      const username = localStorage.getItem(USERNAME_KEY);
      const publicKey = localStorage.getItem(PUBLIC_KEY_KEY);
      
      if (!userId || !username) {
        return null;
      }
      
      return { userId, username, publicKey: publicKey || undefined };
    } catch {
      return null;
    }
  },

  // Xóa session data
  clear(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(USER_ID_KEY);
      localStorage.removeItem(USERNAME_KEY);
      localStorage.removeItem(PUBLIC_KEY_KEY);
    } catch {
      // 
    }
  },

  has(): boolean {
    return this.get() !== null;
  },
};

