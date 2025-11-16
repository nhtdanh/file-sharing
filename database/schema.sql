CREATE DATABASE IF NOT EXISTS zkfiles CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE zkfiles;

CREATE TABLE IF NOT EXISTS users (
    user_id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    username VARCHAR(50) UNIQUE NOT NULL,
    public_key TEXT NOT NULL,
    encrypted_private_key TEXT NOT NULL,
    salt VARCHAR(64) NOT NULL, -- Cần vì mật khẩu có thể giống
    -- Audit
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    INDEX idx_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS files (
    file_id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    owner_id CHAR(36) NOT NULL,
    encrypted_blob LONGBLOB NOT NULL,
    iv BINARY(12) NOT NULL,
    auth_tag BINARY(16) NOT NULL,
    file_name VARCHAR(255) NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NULL,
    -- Audit
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(user_id) ON DELETE CASCADE,

    -- Indexes
    INDEX idx_owner (owner_id),
    INDEX idx_uploaded (uploaded_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS file_shares (
    share_id INT AUTO_INCREMENT PRIMARY KEY,
    file_id CHAR(36) NOT NULL,
    shared_to_user CHAR(36) NOT NULL,
    encrypted_aes_key TEXT NOT NULL,
    can_download BOOLEAN DEFAULT TRUE,
    can_reshare BOOLEAN DEFAULT FALSE,  
    -- Audit
    shared_by CHAR(36) NULL,
    shared_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (file_id) REFERENCES files(file_id) ON DELETE CASCADE,
    FOREIGN KEY (shared_to_user) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (shared_by) REFERENCES users(user_id) ON DELETE SET NULL,
    
    -- Mỗi user chỉ có 1 encrypted_aes_key cho 1 file
    UNIQUE KEY unique_file_user (file_id, shared_to_user),

    INDEX idx_shared_to (shared_to_user),
    INDEX idx_file_id (file_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

