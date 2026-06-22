/*
  Warnings:

  - You are about to drop the column `user_permissions` on the `users` table. All the data in the column will be lost.
  - Added the required column `role_id` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `users` DROP COLUMN `user_permissions`,
    ADD COLUMN `role_id` INTEGER NOT NULL;

-- CreateTable
CREATE TABLE `crm_roles` (
    `role_id` INTEGER NOT NULL AUTO_INCREMENT,
    `role_name` VARCHAR(100) NOT NULL,
    `role_created` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `role_updated` DATETIME(0) NULL,

    UNIQUE INDEX `crm_roles_role_name_key`(`role_name`),
    PRIMARY KEY (`role_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `crm_permissions` (
    `permission_id` INTEGER NOT NULL AUTO_INCREMENT,
    `permission_name` VARCHAR(100) NOT NULL,
    `permission_description` VARCHAR(255) NULL,

    UNIQUE INDEX `crm_permissions_permission_name_key`(`permission_name`),
    PRIMARY KEY (`permission_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `crm_role_permissions` (
    `role_id` INTEGER NOT NULL,
    `permission_id` INTEGER NOT NULL,

    PRIMARY KEY (`role_id`, `permission_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `crm_roles`(`role_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `crm_role_permissions` ADD CONSTRAINT `crm_role_permissions_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `crm_roles`(`role_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `crm_role_permissions` ADD CONSTRAINT `crm_role_permissions_permission_id_fkey` FOREIGN KEY (`permission_id`) REFERENCES `crm_permissions`(`permission_id`) ON DELETE CASCADE ON UPDATE CASCADE;
