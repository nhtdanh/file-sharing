import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import 'express-async-errors';
import { connectDatabase, prisma } from './config/db.js';
import authRoutes from './routes/authRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT;

app.use(cors({
  origin: process.env.CORS_ORIGINS || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// API v1 router
const apiRouter = express.Router();

apiRouter.get('/health', async (req, res) => {
  try {
    //kiểm tra kết nối database
    await prisma.$queryRaw`SELECT 1`;
    
    res.json({ 
      status: 'success', 
      message: 'Server đang hoạt động',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      message: 'Server đang hoạt động nhưng chưa kết nối database',
      database: 'disconnected',
      timestamp: new Date().toISOString()
    });
  }
});

// Routes
apiRouter.use('/auth', authRoutes);
// apiRouter.use('/files', fileRoutes);
// apiRouter.use('/users', userRoutes);

// Mount API router với prefix /api/v1
app.use('/api/v1', apiRouter);

//err
app.use((err, req, res, next) => {
  console.error('Lỗi:', err);
  
  res.status(err.status || 500).json({
    status: 'error',
    error: err.message || 'Internal server error'
  });
});

//404
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    error: 'Không tìm thấy route'
  });
});

//khởi động server
async function startServer() {
  const dbConnected = await connectDatabase();
  
  if (!dbConnected) {
    console.error('Server đang khởi động nhưng database chưa kết nối');
  }
  
  app.listen(PORT, () => {
    console.log(`Server đang chạy trên cổng ${PORT}`);
    console.log(`Môi trường: ${process.env.NODE_ENV}`);
  });
}

startServer();

