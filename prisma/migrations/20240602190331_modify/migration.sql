/*
  Warnings:

  - You are about to drop the column `roomId` on the `chat` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `chat` table. All the data in the column will be lost.
  - You are about to drop the `_roomtouser` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `participation` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `roomKey` to the `Chat` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userKey` to the `Chat` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `_roomtouser` DROP FOREIGN KEY `_RoomToUser_A_fkey`;

-- DropForeignKey
ALTER TABLE `_roomtouser` DROP FOREIGN KEY `_RoomToUser_B_fkey`;

-- DropForeignKey
ALTER TABLE `chat` DROP FOREIGN KEY `Chat_roomId_fkey`;

-- DropForeignKey
ALTER TABLE `chat` DROP FOREIGN KEY `Chat_userId_fkey`;

-- DropForeignKey
ALTER TABLE `participation` DROP FOREIGN KEY `Participation_roomId_fkey`;

-- DropForeignKey
ALTER TABLE `participation` DROP FOREIGN KEY `Participation_userId_fkey`;

-- AlterTable
ALTER TABLE `chat` DROP COLUMN `roomId`,
    DROP COLUMN `userId`,
    ADD COLUMN `roomKey` INTEGER NOT NULL,
    ADD COLUMN `userKey` INTEGER NOT NULL;

-- DropTable
DROP TABLE `_roomtouser`;

-- DropTable
DROP TABLE `participation`;

-- CreateTable
CREATE TABLE `Participants` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `roomKey` INTEGER NOT NULL,
    `userKey` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Chat` ADD CONSTRAINT `Chat_roomKey_fkey` FOREIGN KEY (`roomKey`) REFERENCES `Room`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Chat` ADD CONSTRAINT `Chat_userKey_fkey` FOREIGN KEY (`userKey`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Participants` ADD CONSTRAINT `Participants_roomKey_fkey` FOREIGN KEY (`roomKey`) REFERENCES `Room`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Participants` ADD CONSTRAINT `Participants_userKey_fkey` FOREIGN KEY (`userKey`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
