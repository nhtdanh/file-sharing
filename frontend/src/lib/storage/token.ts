// Token storage 

const TOKEN_KEY = 'token';

export const tokenStorage = {
  // Lấy token
  get(): string | null {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },

  // Lưu token
  set(token: string): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      // 
    }
  },

  // Xóa token
  clear(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      // 
    }
  },

  // Kiểm tra có token không
  has(): boolean {
    return this.get() !== null;
  },
};

