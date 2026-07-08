-- AlterTable
ALTER TABLE `crm_orders` ADD COLUMN `parent_order_id` INTEGER NULL;

-- CreateIndex
CREATE INDEX `crm_orders_parent_order_id_idx` ON `crm_orders`(`parent_order_id`);

-- AddForeignKey
ALTER TABLE `crm_orders` ADD CONSTRAINT `crm_orders_parent_order_id_fkey` FOREIGN KEY (`parent_order_id`) REFERENCES `crm_orders`(`crm_order_id`) ON DELETE RESTRICT ON UPDATE CASCADE;
