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
    const response = await apiClient.post<ApiResponse<RegisterResponse>>('/auth/register', data);
    return response.data.data!;
  },

  async login(data: LoginRequest): Promise<LoginData> {
    const response = await apiClient.post<ApiResponse<LoginData>>('/auth/login', data);
    return response.data.data!;
  },

  async getPublicKey(username: string): Promise<PublicKeyData> {
    const response = await apiClient.get<ApiResponse<PublicKeyData>>(`/auth/public-key/${username}`);
    return response.data.data!;
  },
};

