-- CreateTable
CREATE TABLE `crm_call_dispositions` (
    `call_id` INTEGER NOT NULL AUTO_INCREMENT,
    `customer_phone` VARCHAR(25) NOT NULL,
    `customer_name` VARCHAR(255) NULL,
    `agent_id` INTEGER NOT NULL,
    `agent_name` VARCHAR(55) NOT NULL,
    `team_id` INTEGER NOT NULL,
    `disposition` VARCHAR(50) NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,

    INDEX `crm_call_dispositions_agent_id_idx`(`agent_id`),
    INDEX `crm_call_dispositions_team_id_idx`(`team_id`),
    INDEX `crm_call_dispositions_disposition_idx`(`disposition`),
    INDEX `crm_call_dispositions_created_at_idx`(`created_at`),
    PRIMARY KEY (`call_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `crm_call_dispositions` ADD CONSTRAINT `crm_call_dispositions_agent_id_fkey` FOREIGN KEY (`agent_id`) REFERENCES `users`(`uid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `crm_call_dispositions` ADD CONSTRAINT `crm_call_dispositions_team_id_fkey` FOREIGN KEY (`team_id`) REFERENCES `crm_teams`(`team_id`) ON DELETE RESTRICT ON UPDATE CASCADE;
