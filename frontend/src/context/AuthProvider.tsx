import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { AuthContext, type AuthContextType } from './AuthContext';
import { authService } from '@/services';
import { tokenStorage, keysStorage, userSessionStorage, clearAllStorage } from '@/lib/storage';
import type { AuthUser } from '@/types';
import {
  generateAndExportKeyPair,
  exportPrivateKey,
  importPrivateKey,
} from '@/lib/crypto';
import { encryptPrivateKeyWithPassword, decryptPrivateKeyWithPassword } from '@/lib/crypto';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user từ storage khi mount
  useEffect(() => {
    const loadUser = () => {
      try {
        const token = tokenStorage.get();
        const session = userSessionStorage.get();

        // Chỉ set user nếu có cả token và session
        // Private key có thể không có (sessionStorage clear), user sẽ cần login lại để decrypt
        if (token && session) {
          setUser({
            userId: session.userId,
            username: session.username,
            token,
          });
        } else {
          // Nếu thiếu token hoặc session, clear tất cả để đảm bảo consistency
          if (!token || !session) {
            clearAllStorage();
          }
        }
      } catch {
        // 
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  // Register
  const register = useCallback(async (username: string, password: string) => {
    try {
      // Tạo RSA keypair
      const keyPair = await generateAndExportKeyPair();

      // Encrypt private key với password
      const { encryptedPrivateKey, salt } = await encryptPrivateKeyWithPassword(
        await importPrivateKey(keyPair.privateKey),
        password
      );

      // Gửi lên server
      await authService.register({
        username,
        publicKey: keyPair.publicKey,
        encryptedPrivateKey,
        salt,
      });

      // Không tự động login sau register, user cần login
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Đăng ký thất bại');
    }
  }, []);

  // Login
  const login = useCallback(async (username: string, password: string) => {
    try {
      // Gửi request login
      const loginData = await authService.login({ username });

      // Decrypt private key với password
      const privateKey = await decryptPrivateKeyWithPassword(
        loginData.encryptedPrivateKey,
        password,
        loginData.salt
      );

      // Export private key thành base64 để lưu
      const privateKeyBase64 = await exportPrivateKey(privateKey);

      // Lưu vào storage
      tokenStorage.set(loginData.token);
      keysStorage.set(privateKeyBase64, loginData.salt);
      userSessionStorage.set({
        userId: loginData.userId,
        username: loginData.username,
      });

      // Update state
      setUser({
        userId: loginData.userId,
        username: loginData.username,
        token: loginData.token,
      });
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Đăng nhập thất bại');
    }
  }, []);

  // Logout
  const logout = useCallback(() => {
    clearAllStorage();
    setUser(null);
  }, []);

  // Get private key (để dùng cho file operations)
  const getPrivateKey = useCallback(async (): Promise<CryptoKey | null> => {
    try {
      const privateKeyBase64 = keysStorage.getPrivateKey();
      if (!privateKeyBase64) {
        return null;
      }

      return await importPrivateKey(privateKeyBase64);
    } catch {
      return null;
    }
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    register,
    login,
    logout,
    getPrivateKey,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

