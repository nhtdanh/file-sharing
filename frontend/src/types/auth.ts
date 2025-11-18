export interface RegisterRequest {
  username: string;
  publicKey: string;
  encryptedPrivateKey: string;
  salt: string;
}

export interface RegisterResponse {
  userId: string;
  username: string;
  createdAt: string;
}

export interface LoginRequest {
  username: string;
}

export interface LoginData {
  userId: string;
  username: string;
  publicKey: string;
  encryptedPrivateKey: string;
  salt: string;
  token: string;
}

// Get public key
export interface PublicKeyData {
  userId: string;
  username: string;
  publicKey: string;
}

// User data trong auth context
export interface AuthUser {
  userId: string;
  username: string;
  token: string;
  publicKey: string; // RSA public key để mã hóa AES key khi upload
}
