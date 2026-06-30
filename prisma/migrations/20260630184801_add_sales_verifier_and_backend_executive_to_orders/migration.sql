-- AlterTable
ALTER TABLE `crm_orders` ADD COLUMN `order_backend_executive_id` INTEGER NULL,
    ADD COLUMN `order_backend_executive_name` VARCHAR(55) NULL,
    ADD COLUMN `order_sales_verifier_id` INTEGER NULL,
    ADD COLUMN `order_sales_verifier_name` VARCHAR(55) NULL;

-- CreateIndex
CREATE INDEX `crm_orders_order_sales_verifier_id_idx` ON `crm_orders`(`order_sales_verifier_id`);

-- CreateIndex
CREATE INDEX `crm_orders_order_backend_executive_id_idx` ON `crm_orders`(`order_backend_executive_id`);

-- AddForeignKey
ALTER TABLE `crm_orders` ADD CONSTRAINT `crm_orders_order_sales_verifier_id_fkey` FOREIGN KEY (`order_sales_verifier_id`) REFERENCES `users`(`uid`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `crm_orders` ADD CONSTRAINT `crm_orders_order_backend_executive_id_fkey` FOREIGN KEY (`order_backend_executive_id`) REFERENCES `users`(`uid`) ON DELETE SET NULL ON UPDATE CASCADE;
