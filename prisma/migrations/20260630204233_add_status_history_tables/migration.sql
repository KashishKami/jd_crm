-- CreateTable
CREATE TABLE `crm_sale_status_history` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `order_id` INTEGER NOT NULL,
    `old_value` VARCHAR(10) NULL,
    `new_value` VARCHAR(10) NOT NULL,
    `changed_by_id` INTEGER NOT NULL,
    `changed_by_name` VARCHAR(55) NOT NULL,
    `changed_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `crm_sale_status_history_order_id_idx`(`order_id`),
    INDEX `crm_sale_status_history_changed_at_idx`(`changed_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `crm_order_current_status_history` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `order_id` INTEGER NOT NULL,
    `old_value` VARCHAR(55) NULL,
    `new_value` VARCHAR(55) NOT NULL,
    `changed_by_id` INTEGER NOT NULL,
    `changed_by_name` VARCHAR(55) NOT NULL,
    `changed_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `crm_order_current_status_history_order_id_idx`(`order_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `crm_sale_status_history` ADD CONSTRAINT `crm_sale_status_history_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `crm_orders`(`crm_order_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `crm_sale_status_history` ADD CONSTRAINT `crm_sale_status_history_changed_by_id_fkey` FOREIGN KEY (`changed_by_id`) REFERENCES `users`(`uid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `crm_order_current_status_history` ADD CONSTRAINT `crm_order_current_status_history_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `crm_orders`(`crm_order_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `crm_order_current_status_history` ADD CONSTRAINT `crm_order_current_status_history_changed_by_id_fkey` FOREIGN KEY (`changed_by_id`) REFERENCES `users`(`uid`) ON DELETE RESTRICT ON UPDATE CASCADE;
