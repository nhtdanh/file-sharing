import apiClient from '@/lib/axios';
import type {
  UserSearchQuery,
  UserSearchResult,
  UserData,
  ApiResponse,
} from '@/types';

export const userService = {

  async search(query: UserSearchQuery): Promise<UserSearchResult[]> {
    const response = await apiClient.get<ApiResponse<UserSearchResult[]>>('/users/search', {
      params: query,
    });
    return response.data.data!;
  },

  async getById(id: string): Promise<UserData> {
    const response = await apiClient.get<ApiResponse<UserData>>(`/users/${id}`);
    return response.data.data!;
  },
};

