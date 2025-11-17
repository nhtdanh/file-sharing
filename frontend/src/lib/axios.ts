import axios, { type AxiosInstance, type InternalAxiosRequestConfig, type AxiosResponse, type AxiosError } from 'axios';
import type { ApiResponse } from '@/types';

const getBaseURL = (): string => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  return `${apiUrl}/api/v1`;
};

const apiClient: AxiosInstance = axios.create({
  baseURL: getBaseURL(),
  timeout: 30000,
  withCredentials: true, 
  headers: {
    'Content-Type': 'application/json',
  },
});

// request
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

//response
apiClient.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    return response;
  },
  (error: AxiosError<ApiResponse>) => {
    if (!error.response) {
      const networkError: ApiResponse & { statusCode?: number } = {
        status: 'error',
        error: error.code === 'ECONNABORTED' 
          ? 'Request timeout' 
          : 'Không thể kết nối đến server',
        code: 'NETWORK_ERROR',
        statusCode: 0
      };
      return Promise.reject(networkError);
    }

    const { status, data } = error.response;
    // 401 - Unauthorized
    if (status === 401) {
      clearToken();
    }

    //thêm statusCode
    const errorResponse: ApiResponse & { statusCode: number } = {
      ...(data || {
        status: 'error',
        error: 'Đã xảy ra lỗi',
        code: 'UNKNOWN_ERROR'
      }),
      statusCode: status
    };

    return Promise.reject(errorResponse);
  }
);


function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem('token');
  } catch {
    return null;
  }
}

function clearToken(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem('token');
  } catch {
    // 
  }
}

export default apiClient;
