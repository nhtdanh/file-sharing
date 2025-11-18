import apiClient from '@/lib/axios';
import type {
  RegisterRequest,
  RegisterResponse,
  LoginRequest,
  LoginData,
  PublicKeyData,
  ApiResponse,
} from '@/types';

export const authService = {
  async register(data: RegisterRequest): Promise<RegisterResponse> {
    console.log('[API] POST /auth/register');
    console.log('[API] Request:', {
      username: data.username,
      publicKeyLength: data.publicKey.length,
      encryptedPrivateKeyLength: data.encryptedPrivateKey.length,
      salt: data.salt,
    });
    
    const response = await apiClient.post<ApiResponse<RegisterResponse>>('/auth/register', data);
    
    console.log('[API] Response status:', response.status);
    console.log('[API] Response data:', response.data.data);
    
    return response.data.data!;
  },

  async login(data: LoginRequest): Promise<LoginData> {
    console.log('[API] POST /auth/login');
    console.log('[API] Request:', data);
    console.log('[API] Zero-Knowledge: Chỉ gửi username, KHÔNG gửi password');
    
    const response = await apiClient.post<ApiResponse<LoginData>>('/auth/login', data);
    
    console.log('[API] Response status:', response.status);
    console.log('[API] Response data:', {
      userId: response.data.data?.userId,
      username: response.data.data?.username,
      hasPublicKey: !!response.data.data?.publicKey,
      hasEncryptedPrivateKey: !!response.data.data?.encryptedPrivateKey,
      hasSalt: !!response.data.data?.salt,
      hasToken: !!response.data.data?.token,
    });
    
    return response.data.data!;
  },

  async getPublicKey(username: string): Promise<PublicKeyData> {
    const response = await apiClient.get<ApiResponse<PublicKeyData>>(`/auth/public-key/${username}`);
    return response.data.data!;
  },
};

