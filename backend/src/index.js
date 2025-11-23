import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import 'express-async-errors';
import { connectDatabase, prisma } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import fileRoutes from './routes/fileRoutes.js';
import shareRoutes from './routes/shareRoutes.js';
import userRoutes from './routes/userRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT;

app.use(cors({
  origin: process.env.CORS_ORIGINS || 'http://localhost:3000',
  credentials: true
}));

//binary to base64 tăng 33% kích thước
app.use(express.json({ limit: '750mb' }));
app.use(express.urlencoded({ extended: true, limit: '750mb' }));

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


apiRouter.use('/auth', authRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/files', shareRoutes); // Share routes đặt trước
apiRouter.use('/files', fileRoutes);

// versioning
app.use('/api/v1', apiRouter);

// phải đặt cuối
app.use(errorHandler);

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

