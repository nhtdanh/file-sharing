// Session storage - userId, username

const USER_ID_KEY = 'user_id';
const USERNAME_KEY = 'username';

export interface SessionData {
  userId: string;
  username: string;
}

export const userSessionStorage = {

  set(data: SessionData): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(USER_ID_KEY, data.userId);
      localStorage.setItem(USERNAME_KEY, data.username);
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
      
      if (!userId || !username) {
        return null;
      }
      
      return { userId, username };
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
    } catch {
      // 
    }
  },

  has(): boolean {
    return this.get() !== null;
  },
};

