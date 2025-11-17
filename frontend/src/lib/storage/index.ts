// Storage utilities exports
export { tokenStorage } from './token';
export { keysStorage } from './keys';
export { userSessionStorage, type SessionData } from './session';

// Clear tất cả storage (dùng khi logout)
export function clearAllStorage(): void {
  tokenStorage.clear();
  keysStorage.clear();
  userSessionStorage.clear();
}

