-- AlterTable
ALTER TABLE `crm_orders` ADD COLUMN `order_liftgate_needed` VARCHAR(20) NULL DEFAULT 'No',
    ADD COLUMN `order_part_found_by_id` INTEGER NULL,
    ADD COLUMN `order_part_found_by_name` VARCHAR(55) NULL;

-- CreateIndex
CREATE INDEX `crm_orders_order_part_found_by_id_idx` ON `crm_orders`(`order_part_found_by_id`);

-- AddForeignKey
ALTER TABLE `crm_orders` ADD CONSTRAINT `crm_orders_order_part_found_by_id_fkey` FOREIGN KEY (`order_part_found_by_id`) REFERENCES `users`(`uid`) ON DELETE SET NULL ON UPDATE CASCADE;
