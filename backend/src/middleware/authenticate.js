import { verifyToken } from '../utils/jwt.js';

export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      status: 'error',
      error: 'Token không hợp lệ'
    });
  }
  
  const token = authHeader.substring(7);
  const decoded = verifyToken(token);
  
  if (!decoded) {
    return res.status(401).json({
      status: 'error',
      error: 'Token đã hết hạn hoặc không hợp lệ'
    });
  }
  
  req.user = {
    userId: decoded.userId,
    username: decoded.username
  };
  
  next();
}

