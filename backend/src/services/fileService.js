import { prisma } from '../config/db.js';
import { validateFileSize, convertBase64ToBuffer, validateMimeType } from '../utils/fileUtils.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

// Category mapping: category → array of MIME types
const CATEGORY_MIME_MAP = {
  'image': ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp'],
  'video': ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm'],
  'audio': ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm'],
  'document': [
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
    'application/json'
  ],
  'archive': [
    'application/zip',
    'application/x-zip-compressed',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
    'application/x-tar',
    'application/gzip'
  ]
};

export async function uploadFile(ownerId, fileData) {
  const { encryptedBlob, iv, authTag, encryptedAesKey, fileName, fileSize, mimeType } = fileData;
  
  // validate MIME type
  validateMimeType(mimeType);
  
  const fileSizeNum = Number(fileSize);
  validateFileSize(fileSizeNum);
  
  const encryptedBlobBuffer = convertBase64ToBuffer(encryptedBlob);
  const ivBuffer = convertBase64ToBuffer(iv);
  const authTagBuffer = convertBase64ToBuffer(authTag);
  
  // validate buffer sizes sau khi decode
  if (ivBuffer.length !== 12) {
    throw new ValidationError('IV phải có độ dài 12 bytes');
  }
  
  if (authTagBuffer.length !== 16) {
    throw new ValidationError('AuthTag phải có độ dài 16 bytes');
  }
  
  // validate file size sau khi decode 
  validateFileSize(encryptedBlobBuffer.length);
  
  // validate encryptedAesKey
  if (!encryptedAesKey || typeof encryptedAesKey !== 'string' || encryptedAesKey.trim().length === 0) {
    throw new ValidationError('encryptedAesKey không được để trống');
  }
  
  const file = await prisma.file.create({
    data: {
      ownerId,
      encryptedBlob: encryptedBlobBuffer,
      iv: ivBuffer,
      authTag: authTagBuffer,
      encryptedAesKey,
      fileName,
      fileSize: BigInt(fileSizeNum),
      mimeType
    },
    select: {
      id: true,
      fileName: true,
      fileSize: true,
      mimeType: true,
      uploadedAt: true
    }
  });
  
  return file;
}

export async function getFilesByOwner(ownerId, page = 1, limit = 20, search = '', sortBy = 'date', sortOrder = 'desc', categoryFilter = '') {
  const skip = (page - 1) * limit;
  
  // điều kiện where
  const where = {
    ownerId,
    ...(search && search.trim() ? {
      fileName: {
        contains: search.trim()
      }
    } : {}),
    ...(categoryFilter ? (() => {
      // dùng in với category có mapping
      if (CATEGORY_MIME_MAP[categoryFilter]) {
        return {
          mimeType: {
            in: CATEGORY_MIME_MAP[categoryFilter]
          }
        };
      }
      // Ko có dùng startsWith
      return {
        mimeType: {
          startsWith: categoryFilter
        }
      };
    })() : {})
  };
  
  //order
  let orderBy = {};
  switch (sortBy) {
    case 'name':
      orderBy = { fileName: sortOrder };
      break;
    case 'size':
      orderBy = { fileSize: sortOrder };
      break;
    case 'date':
    default:
      orderBy = { uploadedAt: sortOrder };
      break;
  }
  
  const [files, total] = await Promise.all([
    prisma.file.findMany({
      where,
      select: {
        id: true,
        fileName: true,
        fileSize: true,
        mimeType: true,
        uploadedAt: true
      },
      orderBy,
      skip,
      take: limit
    }),
    prisma.file.count({
      where
    })
  ]);
  
  const totalPages = Math.ceil(total / limit);
  const normalizedPage = totalPages > 0 && page > totalPages ? totalPages : (totalPages === 0 ? 1 : page);
  
  return {
    files,
    pagination: {
      page: normalizedPage,
      limit,
      total,
      totalPages,
      hasNext: normalizedPage < totalPages,
      hasPrevious: normalizedPage > 1
    }
  };
}

export async function getFileById(fileId, userId) {
  // chủ hoặc user được share có thể download file
  const file = await prisma.file.findFirst({
    where: {
      id: fileId,
      OR: [
        { ownerId: userId },
        {
          shares: {
            some: {
              sharedToUserId: userId,
              canDownload: true
            }
          }
        }
      ]
    },
    select: {
      id: true,
      ownerId: true,
      encryptedBlob: true,
      iv: true,
      authTag: true,
      encryptedAesKey: true, // Cho owner
      fileName: true,
      fileSize: true,
      mimeType: true,
      uploadedAt: true,
      shares: {
        where: {
          sharedToUserId: userId
        },
        select: {
          encryptedAesKey: true // Cho shared user
        }
      }
    }
  });
  
  if (!file) {
    throw new NotFoundError('File không tồn tại hoặc bạn không có quyền truy cập');
  }
  
  return file;
}

export async function deleteFile(fileId, ownerId) {
  const file = await prisma.file.findFirst({
    where: {
      id: fileId,
      ownerId
    }
  });
  
  if (!file) {
    throw new NotFoundError('File không tồn tại hoặc bạn không có quyền xóa');
  }
  
  await prisma.file.delete({
    where: { id: fileId }
  });
  
  return true;
}

