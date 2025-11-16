import { prisma } from '../config/db.js';
import { NotFoundError } from '../utils/errors.js';

export async function searchUsers(query, currentUserId, limit = 10) {
  if (!query || query.trim().length < 1) {
    return [];
  }
  
  const searchQuery = query.trim().toLowerCase();
  
  const users = await prisma.user.findMany({
    where: {
      username: {
        contains: searchQuery
      },
      id: {
        not: currentUserId
      }
    },
    select: {
      id: true,
      username: true,
      publicKey: true
    },
    take: limit,
    orderBy: {
      username: 'asc'
    }
  });
  
  return users;
}

export async function getUserById(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      publicKey: true,
      createdAt: true
    }
  });
  
  if (!user) {
    throw new NotFoundError('User không tồn tại');
  }
  
  return user;
}

