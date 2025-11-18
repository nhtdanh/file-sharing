import type { ApiResponse } from '@/types';

//lấy error message
export function getErrorMessage(error: unknown, defaultMessage: string = 'Đã xảy ra lỗi'): string {
  if (!error) return defaultMessage;
  
  // ApiResponse object từ axios
  if (typeof error === 'object' && 'error' in error) {
    const apiError = error as ApiResponse;
    if (typeof apiError.error === 'string') {
      return apiError.error;
    }
  }
  

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }
  
  return defaultMessage;
}

