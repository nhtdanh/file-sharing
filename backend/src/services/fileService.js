import { prisma } from '../config/db.js';
import { validateFileSize, convertBase64ToBuffer, validateMimeType } from '../utils/fileUtils.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

export async function uploadFile(ownerId, fileData) {
  const { encryptedBlob, iv, authTag, fileName, fileSize, mimeType } = fileData;
  
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
  
  const file = await prisma.file.create({
    data: {
      ownerId,
      encryptedBlob: encryptedBlobBuffer,
      iv: ivBuffer,
      authTag: authTagBuffer,
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

export async function getFilesByOwner(ownerId, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  
  const [files, total] = await Promise.all([
    prisma.file.findMany({
      where: { ownerId },
      select: {
        id: true,
        fileName: true,
        fileSize: true,
        mimeType: true,
        uploadedAt: true
      },
      orderBy: {
        uploadedAt: 'desc'
      },
      skip,
      take: limit
    }),
    prisma.file.count({
      where: { ownerId }
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
    include: {
      shares: {
        where: {
          sharedToUserId: userId
        },
        select: {
          encryptedAesKey: true
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

