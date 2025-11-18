import * as authService from '../services/authService.js';

export async function register(req, res) {
  const user = await authService.registerUser(req.body);
  
  res.status(201).json({
    status: 'success',
    data: {
      userId: user.id,
      username: user.username,
      createdAt: user.createdAt
    },
    message: 'Đăng kí thành công'
  });
}

export async function login(req, res) {
  const userData = await authService.loginUser(req.body.username);
  
  res.json({
    status: 'success',
    data: userData,
    message: 'Đăng nhập thành công'
  });
}

export async function getPublicKey(req, res) {
  const { username } = req.params;
  const publicKeyData = await authService.getUserPublicKey(username);
  
  res.json({
    status: 'success',
    data: publicKeyData
  });
}

