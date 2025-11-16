# Zero-Knowledge File Sharing System

Hệ thống chia sẻ file với mô hình Zero-Knowledge - Server không nhìn thấy nội dung file gốc.

## Tech Stack

### Frontend
- React 19 + TypeScript
- Vite
- Tailwind CSS + shadcn/ui
- React Router
- Axios
- React Hook Form + Zod

### Backend
- Node.js + Express
- Prisma ORM
- MySQL
- JWT Authentication

### Crypto
- Web Crypto API (Client-side)
- AES-GCM (256-bit)
- RSA-OAEP (4096-bit)
- Scrypt (Password derivation)

## Hướng dẫn setup

### Yêu cầu
- Node.js 18+
- MySQL 8.0+

### 1. Database Setup

```powershell
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS zkfiles CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"


### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Tạo .env file
cp .env.example .env
# Chỉnh sửa DATABASE_URL trong .env với thông tin MySQL của bạn

# Tạo Prisma Client 
npx prisma generate

# Tạo tables từ Prisma schema 
npx prisma migrate dev --name init

# Run
npm run dev
```


Backend sẽ chạy tại port `http://localhost:5000`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Tạo .env file
cp .env.example .env


# Run
npm run dev
```

Frontend sẽ chạy tại port `http://localhost:3000`

## Tính năng

- User Registration/Login
- File Upload (encrypted client-side)
- File Download (decrypted client-side)
- File Sharing (share với nhiều user)
- Zero-Knowledge: Server không thấy nội dung file

## Security

- File content: Encrypted với AES-256-GCM
- Private keys: Encrypted với password-derived key (Scrypt)
- File keys: Encrypted với RSA-OAEP (4096-bit)
- Integrity: GCM auth tag tự động phát hiện tamper



