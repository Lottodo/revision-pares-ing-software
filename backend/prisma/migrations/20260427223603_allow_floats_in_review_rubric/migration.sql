/*
  Warnings:

  - You are about to alter the column `originality` on the `reviews` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Double`.
  - You are about to alter the column `methodologicalRigor` on the `reviews` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Double`.
  - You are about to alter the column `writingQuality` on the `reviews` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Double`.
  - You are about to alter the column `relevance` on the `reviews` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Double`.

*/
-- AlterTable
ALTER TABLE `assignments` MODIFY `status` ENUM('PENDING', 'IN_PROGRESS', 'EVALUATED', 'CANCELLED', 'REJECTED') NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE `papers` ADD COLUMN `area` VARCHAR(100) NULL;

-- AlterTable
ALTER TABLE `reviews` MODIFY `originality` DOUBLE NOT NULL,
    MODIFY `methodologicalRigor` DOUBLE NOT NULL,
    MODIFY `writingQuality` DOUBLE NOT NULL,
    MODIFY `relevance` DOUBLE NOT NULL;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `specialty` VARCHAR(100) NULL;
