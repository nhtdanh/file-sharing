export interface UserSearchQuery {
  username?: string;
  limit?: number | string;
}

export interface UserSearchResult {
  id: string;
  username: string;
  publicKey: string;
}

// User detail data (từ getUserById)
export interface UserData {
  id: string;
  username: string;
  publicKey: string;
  createdAt: string;
}
