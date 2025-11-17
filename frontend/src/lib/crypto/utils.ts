// ArrayBuffer to base64 
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  if (!buffer || !(buffer instanceof ArrayBuffer)) {
    throw new Error('ArrayBuffer không hợp lệ');
  }
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// base64 to ArrayBuffer
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  if (!base64 || typeof base64 !== 'string') {
    throw new Error('Chuỗi base64 không hợp lệ');
  }
  try {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  } catch {
    throw new Error('Định dạng base64 không hợp lệ');
  }
}

//  ArrayBuffer to hex 
export function arrayBufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}

// hex to ArrayBuffer
export function hexToArrayBuffer(hex: string): ArrayBuffer {
  if (!hex || hex.length % 2 !== 0) {
    throw new Error('Chuỗi hex không hợp lệ: độ dài phải là số chẵn');
  }
  
  // ký tự hex (0-9, a-f, A-F)
  if (!/^[0-9a-fA-F]+$/.test(hex)) {
    throw new Error('Chuỗi hex không hợp lệ: chứa ký tự không phải hexadecimal');
  }
  
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    const byteValue = parseInt(hex.substr(i, 2), 16);
    if (isNaN(byteValue)) {
      throw new Error(`Chuỗi hex không hợp lệ: byte không hợp lệ tại vị trí ${i}`);
    }
    bytes[i / 2] = byteValue;
  }
  return bytes.buffer;
}

// string to ArrayBuffer (UTF-8)
export function stringToArrayBuffer(str: string): ArrayBuffer {
  const encoder = new TextEncoder();
  return encoder.encode(str).buffer;
}

// ArrayBuffer to string (UTF-8)
export function arrayBufferToString(buffer: ArrayBuffer): string {
  const decoder = new TextDecoder();
  return decoder.decode(buffer);
}

