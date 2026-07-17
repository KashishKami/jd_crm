-- CreateTable (if not exists — table was created outside of Prisma migrations)
CREATE TABLE IF NOT EXISTS `crm_follow_ups` (
    `follow_up_id` INTEGER NOT NULL AUTO_INCREMENT,
    `agent_id` INTEGER NOT NULL,
    `agent_name` VARCHAR(55) NOT NULL,
    `customer_name` VARCHAR(511) NOT NULL,
    `customer_phone` VARCHAR(25) NULL,
    `customer_state` VARCHAR(100) NOT NULL,
    `customer_country` VARCHAR(50) NOT NULL,
    `customer_timezone` VARCHAR(100) NOT NULL,
    `vehicle_year_make_model` VARCHAR(255) NOT NULL,
    `part_required` VARCHAR(255) NOT NULL,
    `part_description` TEXT NULL,
    `quoted_options` TEXT NULL,
    `follow_up_date` DATE NOT NULL,
    `follow_up_time` VARCHAR(5) NOT NULL,
    `follow_up_reason` VARCHAR(255) NOT NULL,
    `status` VARCHAR(50) NOT NULL,
    `priority` VARCHAR(10) NOT NULL,
    `notes` TEXT NULL,
    `entry_date` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `last_contact` DATETIME(0) NULL,
    `notification_sent_at` DATETIME(0) NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,

    INDEX `crm_follow_ups_agent_id_idx`(`agent_id`),
    INDEX `crm_follow_ups_follow_up_date_idx`(`follow_up_date`),
    INDEX `crm_follow_ups_status_idx`(`status`),
    INDEX `crm_follow_ups_priority_idx`(`priority`),
    PRIMARY KEY (`follow_up_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable — add part_description column if it doesn't exist yet (safe on existing tables)
ALTER TABLE `crm_follow_ups` ADD COLUMN IF NOT EXISTS `part_description` TEXT NULL;
