import * as authService from '../services/authService.js';

export async function register(req, res) {
  try {
    const user = await authService.registerUser(req.body);
    
    res.status(201).json({
      status: 'success',
      data: {
        userId: user.id,
        username: user.username,
        createdAt: user.createdAt
      },
      message: 'Đăng ký thành công'
    });
  } catch (error) {
    if (error.message === 'Username đã tồn tại') {
      return res.status(409).json({
        status: 'error',
        error: error.message
      });
    }
    
    res.status(500).json({
      status: 'error',
      error: error.message || 'Lỗi đăng ký'
    });
  }
}

export async function login(req, res) {
  try {
    const userData = await authService.loginUser(req.body.username);
    
    res.json({
      status: 'success',
      data: userData,
      message: 'Đăng nhập thành công'
    });
  } catch (error) {
    if (error.message === 'Username không tồn tại') {
      return res.status(404).json({
        status: 'error',
        error: error.message
      });
    }
    
    res.status(500).json({
      status: 'error',
      error: error.message || 'Lỗi đăng nhập'
    });
  }
}

export async function getPublicKey(req, res) {
  try {
    const { username } = req.params;
    const publicKeyData = await authService.getUserPublicKey(username);
    
    res.json({
      status: 'success',
      data: publicKeyData
    });
  } catch (error) {
    if (error.message === 'Username không tồn tại') {
      return res.status(404).json({
        status: 'error',
        error: error.message
      });
    }
    
    res.status(500).json({
      status: 'error',
      error: error.message || 'Lỗi lấy public key'
    });
  }
}

