import * as shareService from '../services/shareService.js';

export async function share(req, res) {
  const { userId } = req.user;
  const { id: fileId } = req.params;
  const { sharedToUserId, encryptedAesKey, canDownload, canReshare } = req.body;
  
  const share = await shareService.shareFile(
    fileId,
    sharedToUserId,
    encryptedAesKey,
    userId,
    canDownload ?? true,
    canReshare ?? false
  );
  
  res.status(201).json({
    status: 'success',
    data: share,
    message: 'Share file thành công'
  });
}

export async function getSharedFiles(req, res) {
  const { userId } = req.user;
  const { page, limit } = req.query;
  
  const pageNum = page ? parseInt(page, 10) : 1;
  const limitNum = limit ? parseInt(limit, 10) : 20;
  
  const validPage = isNaN(pageNum) || pageNum < 1 ? 1 : pageNum;
  const validLimit = isNaN(limitNum) || limitNum < 1 ? 20 : Math.min(limitNum, 100);
  
  const result = await shareService.getSharedFiles(userId, validPage, validLimit);
  
  res.json({
    status: 'success',
    data: result.sharedFiles,
    pagination: result.pagination
  });
}

export async function getFileShares(req, res) {
  const { userId } = req.user;
  const { id: fileId } = req.params;
  
  const shares = await shareService.getFileShares(fileId, userId);
  
  res.json({
    status: 'success',
    data: shares
  });
}

export async function unshare(req, res) {
  const { userId } = req.user;
  const { id: fileId } = req.params;
  const { sharedToUserId } = req.body;
  
  await shareService.unshareFile(fileId, sharedToUserId, userId);
  
  res.json({
    status: 'success',
    message: 'Hủy share file thành công'
  });
}


