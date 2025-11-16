import { verifyToken } from '../utils/jwt.js';
import { UnauthorizedError } from '../utils/errors.js';

export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Token không hợp lệ');
  }
  
  const token = authHeader.substring(7);
  const decoded = verifyToken(token);
  
  if (!decoded) {
    throw new UnauthorizedError('Token đã hết hạn hoặc không hợp lệ');
  }
  
  req.user = {
    userId: decoded.userId,
    username: decoded.username
  };
  
  next();
}

