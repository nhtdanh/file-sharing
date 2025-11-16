import express from 'express';
import * as userController from '../controllers/userController.js';
import { authenticate } from '../middleware/authenticate.js';

const router = express.Router();

router.get('/search', authenticate, userController.search);
router.get('/:id', authenticate, userController.getById);

export default router;

