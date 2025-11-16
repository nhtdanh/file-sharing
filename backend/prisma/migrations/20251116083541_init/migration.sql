-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `username` VARCHAR(50) NOT NULL,
    `public_key` TEXT NOT NULL,
    `encrypted_private_key` TEXT NOT NULL,
    `salt` VARCHAR(64) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `last_login` DATETIME(3) NULL,

    UNIQUE INDEX `users_username_key`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `files` (
    `id` VARCHAR(191) NOT NULL,
    `owner_id` VARCHAR(191) NOT NULL,
    `encrypted_blob` LONGBLOB NOT NULL,
    `iv` BINARY(12) NOT NULL,
    `auth_tag` BINARY(16) NOT NULL,
    `file_name` VARCHAR(255) NULL,
    `file_size` BIGINT NOT NULL,
    `mime_type` VARCHAR(100) NULL,
    `uploaded_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `files_owner_id_idx`(`owner_id`),
    INDEX `files_uploaded_at_idx`(`uploaded_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `file_shares` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `file_id` VARCHAR(191) NOT NULL,
    `shared_to_user` VARCHAR(191) NOT NULL,
    `encrypted_aes_key` TEXT NOT NULL,
    `can_download` BOOLEAN NOT NULL DEFAULT true,
    `can_reshare` BOOLEAN NOT NULL DEFAULT false,
    `shared_by` VARCHAR(191) NULL,
    `shared_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `file_shares_shared_to_user_idx`(`shared_to_user`),
    INDEX `file_shares_file_id_idx`(`file_id`),
    UNIQUE INDEX `file_shares_file_id_shared_to_user_key`(`file_id`, `shared_to_user`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `files` ADD CONSTRAINT `files_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `file_shares` ADD CONSTRAINT `file_shares_file_id_fkey` FOREIGN KEY (`file_id`) REFERENCES `files`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `file_shares` ADD CONSTRAINT `file_shares_shared_to_user_fkey` FOREIGN KEY (`shared_to_user`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `file_shares` ADD CONSTRAINT `file_shares_shared_by_fkey` FOREIGN KEY (`shared_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
