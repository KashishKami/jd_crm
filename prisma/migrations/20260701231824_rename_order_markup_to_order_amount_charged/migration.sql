-- Drop the dormant order_amount_charged column first
ALTER TABLE `crm_orders` DROP COLUMN `order_amount_charged`;

-- Rename order_markup to order_amount_charged
ALTER TABLE `crm_orders` RENAME COLUMN `order_markup` TO `order_amount_charged`;
