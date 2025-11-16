import { prisma } from '../config/db.js';
import { ValidationError, NotFoundError, ConflictError } from '../utils/errors.js';

export async function shareFile(fileId, sharedToUserId, encryptedAesKey, sharedById, canDownload = true, canReshare = false) {
  // kiểm tra không share cho chính mình
  if (sharedById === sharedToUserId) {
    throw new ValidationError('Không thể share file cho chính mình');
  }
  
  // kiểm tra file tồn tại và thuộc owner (sharedById)
  const file = await prisma.file.findFirst({
    where: {
      id: fileId,
      ownerId: sharedById
    }
  });
  
  if (!file) {
    throw new NotFoundError('File không tồn tại hoặc bạn không có quyền share');
  }
  
  // kiểm tra user được share tồn tại
  const sharedToUser = await prisma.user.findUnique({
    where: { id: sharedToUserId }
  });
  
  if (!sharedToUser) {
    throw new NotFoundError('User được share không tồn tại');
  }
  
  // kiểm tra đã share chưa (unique constraint)
  const existingShare = await prisma.fileShare.findUnique({
    where: {
      fileId_sharedToUserId: {
        fileId,
        sharedToUserId
      }
    }
  });
  
  if (existingShare) {
    throw new ConflictError('File đã được share cho user này');
  }
  
  // share
  const share = await prisma.fileShare.create({
    data: {
      fileId,
      sharedToUserId,
      encryptedAesKey,
      sharedById,
      canDownload,
      canReshare
    },
    select: {
      id: true,
      fileId: true,
      sharedToUserId: true,
      canDownload: true,
      canReshare: true,
      sharedById: true,
      sharedAt: true
    }
  });
  
  return share;
}

export async function getSharedFiles(userId, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  
  const [sharedFiles, total] = await Promise.all([
    prisma.fileShare.findMany({
      where: { sharedToUserId: userId },
      include: {
        file: {
          select: {
            id: true,
            fileName: true,
            fileSize: true,
            mimeType: true,
            uploadedAt: true
          }
        },
        sharedByUser: {
          select: {
            id: true,
            username: true
          }
        }
      },
      orderBy: {
        sharedAt: 'desc'
      },
      skip,
      take: limit
    }),
    prisma.fileShare.count({
      where: { sharedToUserId: userId }
    })
  ]);
  
  const totalPages = Math.ceil(total / limit);
  const normalizedPage = totalPages > 0 && page > totalPages ? totalPages : (totalPages === 0 ? 1 : page);
  
  return {
    sharedFiles,
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

export async function getFileShares(fileId, ownerId) {
  // kiểm tra file thuộc owner
  const file = await prisma.file.findFirst({
    where: {
      id: fileId,
      ownerId
    }
  });
  
  if (!file) {
    throw new NotFoundError('File không tồn tại hoặc bạn không có quyền truy cập');
  }
  
  const shares = await prisma.fileShare.findMany({
    where: { fileId },
    include: {
      sharedToUser: {
        select: {
          id: true,
          username: true
        }
      }
    },
    orderBy: {
      sharedAt: 'desc'
    }
  });
  
  return shares;
}

export async function unshareFile(fileId, sharedToUserId, ownerId) {
  // kiểm tra file thuộc owner
  const file = await prisma.file.findFirst({
    where: {
      id: fileId,
      ownerId
    }
  });
  
  if (!file) {
    throw new NotFoundError('File không tồn tại hoặc bạn không có quyền hủy share');
  }
  
  // kiểm tra đã share chưa
  const existingShare = await prisma.fileShare.findUnique({
    where: {
      fileId_sharedToUserId: {
        fileId,
        sharedToUserId
      }
    }
  });
  
  if (!existingShare) {
    throw new NotFoundError('Share không tồn tại');
  }
  
  // hủy share
  await prisma.fileShare.delete({
    where: {
      fileId_sharedToUserId: {
        fileId,
        sharedToUserId
      }
    }
  });
  
  return true;
}


