/*
  Warnings:

  - Added the required column `team_id` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `users` ADD COLUMN `team_id` INTEGER NOT NULL;

-- CreateTable
CREATE TABLE `crm_teams` (
    `team_id` INTEGER NOT NULL AUTO_INCREMENT,
    `team_name` VARCHAR(155) NOT NULL,
    `team_created` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `team_updated` DATETIME(0) NULL,

    PRIMARY KEY (`team_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_team_id_fkey` FOREIGN KEY (`team_id`) REFERENCES `crm_teams`(`team_id`) ON DELETE RESTRICT ON UPDATE CASCADE;
