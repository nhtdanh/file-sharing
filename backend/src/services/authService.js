import { prisma } from '../config/db.js';
import { generateToken } from '../utils/jwt.js';

export async function registerUser(data) {
  const { username, publicKey, encryptedPrivateKey, salt } = data;
  
  //kiểm tra username tồn tại
  const existingUser = await prisma.user.findUnique({
    where: { username }
  });
  
  if (existingUser) {
    throw new Error('Username đã tồn tại');
  }
  
  // tạo user mới
  const user = await prisma.user.create({
    data: {
      username,
      publicKey,
      encryptedPrivateKey,
      salt,
      lastLogin: new Date()
    },
    select: {
      id: true,
      username: true,
      createdAt: true
    }
  });
  
  return user;
}

export async function loginUser(username) {
  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      publicKey: true,
      encryptedPrivateKey: true,
      salt: true
    }
  });
  
  if (!user) {
    throw new Error('Username không tồn tại');
  }
  
  // cập nhật lastLogin
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLogin: new Date() }
  });
  
  // generate JWT token
  const token = generateToken(user.id, user.username);
  
  return {
    userId: user.id,
    username: user.username,
    publicKey: user.publicKey,
    encryptedPrivateKey: user.encryptedPrivateKey,
    salt: user.salt,
    token
  };
}

export async function getUserPublicKey(username) {
  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      publicKey: true
    }
  });
  
  if (!user) {
    throw new Error('Username không tồn tại');
  }
  
  return {
    userId: user.id,
    username: user.username,
    publicKey: user.publicKey
  };
}

