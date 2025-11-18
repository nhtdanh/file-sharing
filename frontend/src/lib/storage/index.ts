// Import trực tiếp 
import { tokenStorage } from './token';
import { keysStorage } from './keys';
import { userSessionStorage } from './session';


export { tokenStorage } from './token';
export { keysStorage } from './keys';
export { userSessionStorage, type SessionData } from './session';

// clear all
export function clearAllStorage(): void {
  tokenStorage.clear();
  keysStorage.clear();
  userSessionStorage.clear();
}

