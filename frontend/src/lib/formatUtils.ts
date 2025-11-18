// Format file size để dễ đọc
export function formatFileSize(bytes: string | number): string {
  let numBytes: number;
  
  if (typeof bytes === 'string') {
    //Xử lí BigInt
    const parsed = Number(bytes);
    if (isNaN(parsed) || !isFinite(parsed)) {
      return '0 B';
    }
    numBytes = parsed;
  } else {
    numBytes = bytes;
  }
  
  if (numBytes < 0) {
    return '0 B';
  }
  
  if (numBytes === 0) {
    return '0 B';
  }
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(numBytes) / Math.log(k));
  const clampedI = Math.min(i, sizes.length - 1);
  
  return `${(numBytes / Math.pow(k, clampedI)).toFixed(clampedI === 0 ? 0 : 1)} ${sizes[clampedI]}`;
}

// Format date từ ISO string sang format dễ đọc
export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    
    // Kiểm tra date hợp lệ
    if (isNaN(date.getTime())) {
      return dateString;
    }
    
    // Format: DD/MM/YYYY HH:mm
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch {
    return dateString;
  }
}

// Lấy icon tùy vào loại file
export function getFileIconName(mimeType: string | null): string {
  if (!mimeType) {
    return 'File';
  }
  
  const lowerMimeType = mimeType.toLowerCase();
  
  if (lowerMimeType.startsWith('image/')) {
    return 'Image';
  }
  if (lowerMimeType.startsWith('video/')) {
    return 'Video';
  }
  if (lowerMimeType.startsWith('audio/')) {
    return 'Music';
  }
  if (lowerMimeType.includes('pdf')) {
    return 'FileText';
  }
  if (lowerMimeType.includes('word') || lowerMimeType.includes('document')) {
    return 'FileText';
  }
  if (lowerMimeType.includes('excel') || lowerMimeType.includes('spreadsheet')) {
    return 'FileSpreadsheet';
  }
  if (lowerMimeType.includes('zip') || lowerMimeType.includes('archive')) {
    return 'Archive';
  }
  
  return 'File';
}

