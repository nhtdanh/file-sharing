import * as fileService from '../services/fileService.js';

export async function upload(req, res) {
  const { userId } = req.user;
  const file = await fileService.uploadFile(userId, req.body);
  
  res.status(201).json({
    status: 'success',
    data: file,
    message: 'Upload file thành công'
  });
}

export async function list(req, res) {
  const { userId } = req.user;
  const { page, limit } = req.query;
  
  const pageNum = page ? parseInt(page, 10) : 1;
  const limitNum = limit ? parseInt(limit, 10) : 20;
  
  const validPage = isNaN(pageNum) || pageNum < 1 ? 1 : pageNum;
  const validLimit = isNaN(limitNum) || limitNum < 1 ? 20 : Math.min(limitNum, 100);
  
  const result = await fileService.getFilesByOwner(userId, validPage, validLimit);
  
  res.json({
    status: 'success',
    data: result.files,
    pagination: result.pagination
  });
}

export async function getById(req, res) {
  const { userId } = req.user;
  const { id } = req.params;
  
  const file = await fileService.getFileById(id, userId);
  
  const fileData = {
    id: file.id,
    encryptedBlob: file.encryptedBlob.toString('base64'),
    iv: file.iv.toString('base64'),
    authTag: file.authTag.toString('base64'),
    fileName: file.fileName,
    fileSize: file.fileSize.toString(),
    mimeType: file.mimeType,
    uploadedAt: file.uploadedAt,
    encryptedAesKey: file.shares?.[0]?.encryptedAesKey || null
  };
  
  res.json({
    status: 'success',
    data: fileData
  });
}

export async function deleteFile(req, res) {
  const { userId } = req.user;
  const { id } = req.params;
  
  await fileService.deleteFile(id, userId);
  
  res.json({
    status: 'success',
    message: 'Xóa file thành công'
  });
}

