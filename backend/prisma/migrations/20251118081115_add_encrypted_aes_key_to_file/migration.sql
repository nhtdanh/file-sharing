/*
  Warnings:

  - Added the required column `encrypted_aes_key` to the `files` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `files` ADD COLUMN `encrypted_aes_key` TEXT NOT NULL;
