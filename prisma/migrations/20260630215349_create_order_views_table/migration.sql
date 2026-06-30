-- CreateTable
CREATE TABLE `crm_order_views` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `order_id` INTEGER NOT NULL,
    `viewer_id` INTEGER NOT NULL,
    `viewer_name` VARCHAR(55) NOT NULL,
    `viewed_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `crm_order_views_order_id_idx`(`order_id`),
    INDEX `crm_order_views_viewer_id_idx`(`viewer_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `crm_order_views` ADD CONSTRAINT `crm_order_views_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `crm_orders`(`crm_order_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `crm_order_views` ADD CONSTRAINT `crm_order_views_viewer_id_fkey` FOREIGN KEY (`viewer_id`) REFERENCES `users`(`uid`) ON DELETE RESTRICT ON UPDATE CASCADE;
