import apiClient from '@/lib/axios';
import type {
  ShareFileRequest,
  ShareFileResponse,
  SharedFileData,
  FileShareData,
  UnshareFileRequest,
  SharedFilesQuery,
  PaginatedResponse,
  Pagination,
  ApiResponse,
} from '@/types';

export const shareService = {

  async share(fileId: string, data: ShareFileRequest): Promise<ShareFileResponse> {
    const response = await apiClient.post<ApiResponse<ShareFileResponse>>(
      `/files/${fileId}/share`,
      data
    );
    return response.data.data!;
  },

  async getSharedFiles(query?: SharedFilesQuery): Promise<{ data: SharedFileData[]; pagination: Pagination }> {
    const response = await apiClient.get<PaginatedResponse<SharedFileData>>('/files/shared', {
      params: query,
    });
    const responseData = response.data as PaginatedResponse<SharedFileData>;
    return {
      data: responseData.data!,
      pagination: responseData.pagination,
    };
  },

  async getFileShares(fileId: string): Promise<FileShareData[]> {
    const response = await apiClient.get<ApiResponse<FileShareData[]>>(`/files/${fileId}/shares`);
    return response.data.data!;
  },

  async unshare(fileId: string, data: UnshareFileRequest): Promise<void> {
    await apiClient.delete(`/files/${fileId}/share`, { data });
  },
};

