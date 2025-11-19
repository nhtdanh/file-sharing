import { ValidationError } from './errors.js';

const MAX_FILE_SIZE_MB = parseInt(process.env.MAX_FILE_SIZE_MB) || 100;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const ALLOWED_MIME_TYPES = [
  //doc
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  'text/markdown',
  'application/json',
  //Image
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/bmp',
  //compress
  'application/zip',
  'application/x-zip-compressed',
  'application/x-rar-compressed',
  'application/x-7z-compressed',
  'application/gzip',
  'application/x-tar',
  //Video
  'video/mp4',
  'video/mpeg',
  'video/quicktime',
  'video/x-msvideo',
  'video/webm',
  //Audio
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
  'audio/webm'
];

export function validateFileSize(fileSize) {
  if (fileSize > MAX_FILE_SIZE_BYTES) {
    throw new ValidationError(`File quá lớn. Kích thước tối đa: ${MAX_FILE_SIZE_MB}MB`);
  }
  return true;
}

export function validateMimeType(mimeType) {
  if (!mimeType) {
    throw new ValidationError('MIME type không được để trống');
  }
  
  if (!ALLOWED_MIME_TYPES.includes(mimeType.toLowerCase())) {
    throw new ValidationError('Loại file không được phép. Chỉ chấp nhận: documents, images, videos, audio, archives');
  }
  
  return true;
}

export function convertBase64ToBuffer(base64String) {
  if (!base64String || typeof base64String !== 'string') {
    throw new ValidationError('Base64 string không hợp lệ');
  }
  
  const base64Data = base64String.includes(',') 
    ? base64String.split(',')[1] 
    : base64String.trim();
  
  if (!base64Data) {
    throw new ValidationError('Base64 data không hợp lệ');
  }
  
  try {
    return Buffer.from(base64Data, 'base64');
  } catch (error) {
    throw new ValidationError('Không thể decode base64 string');
  }
}

