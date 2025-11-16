import { AppError, ValidationError, NotFoundError, UnauthorizedError, ConflictError } from '../utils/errors.js';
import { Prisma } from '@prisma/client';

//trong controller không cần catch async errors 
//vì có express-async-errors (tự forward đếm middleware)
export function errorHandler(err, req, res, next) {

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: 'error',
      error: err.message,
      code: err.code
    });
  }
  
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2025') {
      return res.status(404).json({
        status: 'error',
        error: 'Không tìm thấy dữ liệu',
        code: 'NOT_FOUND'
      });
    }
    
    if (err.code === 'P2002') {
      const field = err.meta?.target?.[0] || 'dữ liệu';
      return res.status(409).json({
        status: 'error',
        error: `${field} đã tồn tại`,
        code: 'CONFLICT'
      });
    }
  }
  
  if (err.name === 'ZodError') {
    const firstError = err.errors[0];
    const fieldName = firstError?.path?.join('.');
    const errorMessage = fieldName 
      ? `${fieldName}: ${firstError.message}`
      : (firstError?.message || 'Dữ liệu không hợp lệ');
    
    const allErrors = err.errors.map(error => ({
      field: error.path?.join('.') || 'root',
      message: error.message
    }));
    
    return res.status(400).json({
      status: 'error',
      error: errorMessage,
      errors: allErrors,
      code: 'VALIDATION_ERROR'
    });
  }
  
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      status: 'error',
      error: 'Token không hợp lệ',
      code: 'UNAUTHORIZED'
    });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      status: 'error',
      error: 'Token đã hết hạn',
      code: 'UNAUTHORIZED'
    });
  }

  //default
  if (process.env.NODE_ENV === 'development') {
    console.error('Lỗi chi tiết:', {
      message: err.message,
      stack: err.stack,
      name: err.name
    });
  } else {
    console.error('Lỗi:', err.message);
  }
  
  res.status(500).json({
    status: 'error',
    error: process.env.NODE_ENV === 'development' 
      ? err.message 
      : 'Internal server error',
    code: 'INTERNAL_ERROR'
  });
}

