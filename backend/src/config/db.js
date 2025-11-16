import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn'] 
    : ['error'],
});

async function connectDatabase() {
  try {
    await prisma.$connect();
    console.log('Kết nối database thành công');
    return true;
  } catch (error) {
    console.error('Lỗi kết nối database:', error.message);
    return false;
  }
}

export { prisma, connectDatabase };

