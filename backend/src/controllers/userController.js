import * as userService from '../services/userService.js';

export async function search(req, res) {
  const { userId } = req.user;
  const { username, limit } = req.query;
  
  const limitNum = limit ? parseInt(limit, 10) : 10;
  const validLimit = isNaN(limitNum) || limitNum < 1 ? 10 : Math.min(limitNum, 50);
  
  const users = await userService.searchUsers(username, userId, validLimit);
  
  res.json({
    status: 'success',
    data: users
  });
}

export async function getById(req, res) {
  const { id } = req.params;
  
  const user = await userService.getUserById(id);
  
  res.json({
    status: 'success',
    data: user
  });
}

