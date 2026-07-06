-- AlterTable
ALTER TABLE `crm_customer_cards` ADD COLUMN `amount_to_charge` VARCHAR(25) NULL,
    ADD COLUMN `customer_card_copy_image` LONGTEXT NULL,
    ADD COLUMN `customer_photo_id_image` LONGTEXT NULL;

-- AlterTable
ALTER TABLE `crm_customers` ADD COLUMN `customer_alternate_phone_1` VARCHAR(25) NULL,
    ADD COLUMN `customer_alternate_phone_2` VARCHAR(25) NULL;

-- AlterTable
ALTER TABLE `crm_vendors` ADD COLUMN `vendor_alternate_phone_1` VARCHAR(15) NULL,
    ADD COLUMN `vendor_alternate_phone_2` VARCHAR(15) NULL,
    ADD COLUMN `vendor_country` VARCHAR(50) NULL,
    ADD COLUMN `vendor_payment_mode` VARCHAR(255) NULL,
    ADD COLUMN `vendor_state` VARCHAR(100) NULL;
