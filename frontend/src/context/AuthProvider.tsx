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
            publicKey: session.publicKey || '', // Có thể không có nếu load từ storage cũ
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
      console.log('[Register] Bắt đầu đăng ký:', username, '| Password length:', password.length);
      console.log('[Register] Zero-Knowledge: Password KHÔNG được gửi lên server');

      // Tạo RSA keypair
      console.log('[Register] Bước 1: Tạo RSA-4096 keypair (client-side)');
      const keyPair = await generateAndExportKeyPair();
      console.log('[Register] Public key:', keyPair.publicKey.length, 'chars | Private key:', keyPair.privateKey.length, 'chars');

      // Encrypt private key với password
      console.log('[Register] Bước 2: Mã hóa private key với password (client-side)');
      const { encryptedPrivateKey, salt } = await encryptPrivateKeyWithPassword(
        await importPrivateKey(keyPair.privateKey),
        password
      );
      console.log('[Register] Salt:', salt, '| Encrypted private key:', encryptedPrivateKey.length, 'chars');
      console.log('[Register] Zero-Knowledge: Private key được mã hóa trước khi gửi lên server');

      // Gửi lên server
      const registerData = {
        username,
        publicKey: keyPair.publicKey,
        encryptedPrivateKey,
        salt,
      };

      console.log('[Register] Bước 3: Gửi request lên server');
      console.log('[Register] Request:', {
        username: registerData.username,
        publicKeyLength: registerData.publicKey.length,
        encryptedPrivateKeyLength: registerData.encryptedPrivateKey.length,
        salt: registerData.salt,
      });
      console.log('[Register] Zero-Knowledge: Server KHÔNG nhận được password và private key gốc');

      const response = await authService.register(registerData);
      
      console.log('[Register] Response:', {
        userId: response.userId,
        username: response.username,
        createdAt: response.createdAt,
      });
      console.log('[Register] Đăng ký thành công');
    } catch (error) {
      console.error('[Register] Lỗi:', error);
      throw error;
    }
  }, []);

  // Login
  const login = useCallback(async (username: string, password: string) => {
    try {
      console.log('[Login] Bắt đầu đăng nhập:', username, '| Password length:', password.length);
      console.log('[Login] Zero-Knowledge: Password KHÔNG được gửi lên server');

      // Gửi request login
      console.log('[Login] Bước 1: Gửi request login (chỉ username)');
      console.log('[Login] Request:', { username });
      console.log('[Login] Zero-Knowledge: Server KHÔNG verify password, chỉ trả về encrypted data');

      const loginData = await authService.login({ username });

      console.log('[Login] Bước 2: Nhận response từ server');
      console.log('[Login] Response:', {
        userId: loginData.userId,
        username: loginData.username,
        hasPublicKey: !!loginData.publicKey,
        hasEncryptedPrivateKey: !!loginData.encryptedPrivateKey,
        hasSalt: !!loginData.salt,
        hasToken: !!loginData.token,
        publicKeyLength: loginData.publicKey?.length,
        encryptedPrivateKeyLength: loginData.encryptedPrivateKey?.length,
        salt: loginData.salt,
      });
      console.log('[Login] Zero-Knowledge: Server trả về encrypted private key, KHÔNG verify password');

      // Decrypt private key với password
      console.log('[Login] Bước 3: Giải mã private key với password (client-side)');
      console.log('[Login] Zero-Knowledge: Password verification xảy ra ở đây (client-side)');
      console.log('[Login] Nếu password sai → decrypt sẽ thất bại');
      
      const privateKey = await decryptPrivateKeyWithPassword(
        loginData.encryptedPrivateKey,
        password,
        loginData.salt
      );
      console.log('[Login] Private key đã được giải mã thành công');
      console.log('[Login] Password đúng - xác thực thành công (client-side)');

      // Export private key thành base64 để lưu
      console.log('[Login] Bước 4: Lưu vào storage');
      const privateKeyBase64 = await exportPrivateKey(privateKey);
      
      tokenStorage.set(loginData.token);
      keysStorage.set(privateKeyBase64, loginData.salt);
      userSessionStorage.set({
        userId: loginData.userId,
        username: loginData.username,
        publicKey: loginData.publicKey,
      });
      console.log('[Login] Token (localStorage) | Private key (sessionStorage) | Session (localStorage)');

      // Update state
      setUser({
        userId: loginData.userId,
        username: loginData.username,
        token: loginData.token,
        publicKey: loginData.publicKey,
      });
      console.log('[Login] Đăng nhập thành công');
      console.log('[Login] Zero-Knowledge: Toàn bộ quá trình xác thực xảy ra ở client-side');
    } catch (error) {
      console.error('[Login] Lỗi:', error);
      throw error;
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

