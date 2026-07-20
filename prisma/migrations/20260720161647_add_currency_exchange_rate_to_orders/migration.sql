-- AlterTable
ALTER TABLE `crm_orders`
    ADD COLUMN `order_currency` VARCHAR(3) NULL DEFAULT 'USD',
    ADD COLUMN `order_exchange_rate` VARCHAR(15) NULL DEFAULT '1';



