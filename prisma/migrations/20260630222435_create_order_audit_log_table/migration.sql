-- CreateTable
CREATE TABLE `crm_order_audit_log` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `order_id` INTEGER NOT NULL,
    `field_name` VARCHAR(100) NOT NULL,
    `old_value` TEXT NULL,
    `new_value` TEXT NULL,
    `changed_by_id` INTEGER NOT NULL,
    `changed_by_name` VARCHAR(55) NOT NULL,
    `changed_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `crm_order_audit_log_order_id_idx`(`order_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `crm_order_audit_log` ADD CONSTRAINT `crm_order_audit_log_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `crm_orders`(`crm_order_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `crm_order_audit_log` ADD CONSTRAINT `crm_order_audit_log_changed_by_id_fkey` FOREIGN KEY (`changed_by_id`) REFERENCES `users`(`uid`) ON DELETE RESTRICT ON UPDATE CASCADE;
