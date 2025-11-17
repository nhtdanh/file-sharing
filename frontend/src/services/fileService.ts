import apiClient from '@/lib/axios';
import type {
  UploadFileRequest,
  FileData,
  FileDetailData,
  FileListQuery,
  PaginatedResponse,
  Pagination,
  ApiResponse,
} from '@/types';

export const fileService = {

  async upload(data: UploadFileRequest): Promise<FileData> {
    const response = await apiClient.post<ApiResponse<FileData>>('/files/upload', data);
    return response.data.data!;
  },

  async list(query?: FileListQuery): Promise<{ data: FileData[]; pagination: Pagination }> {
    const response = await apiClient.get<PaginatedResponse<FileData>>('/files', { params: query });
    const responseData = response.data as PaginatedResponse<FileData>;
    return {
      data: responseData.data!,
      pagination: responseData.pagination,
    };
  },

  async getById(id: string): Promise<FileDetailData> {
    const response = await apiClient.get<ApiResponse<FileDetailData>>(`/files/${id}`);
    return response.data.data!;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/files/${id}`);
  },
};

