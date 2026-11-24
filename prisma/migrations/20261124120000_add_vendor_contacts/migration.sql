-- AlterTable
ALTER TABLE `crm_orders` ADD COLUMN `order_vendor_contact_id` INTEGER NULL,
    ADD COLUMN `order_vendor_contact_name` VARCHAR(255) NULL;

-- CreateTable
CREATE TABLE `crm_vendor_contacts` (
    `contact_id` INTEGER NOT NULL AUTO_INCREMENT,
    `vendor_id` INTEGER NOT NULL,
    `contact_name` VARCHAR(255) NOT NULL,
    `contact_phone` VARCHAR(25) NULL,
    `contact_email` VARCHAR(255) NULL,
    `contact_status` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,

    INDEX `crm_vendor_contacts_vendor_id_idx`(`vendor_id`),
    PRIMARY KEY (`contact_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `crm_orders_order_vendor_contact_id_idx` ON `crm_orders`(`order_vendor_contact_id`);

-- AddForeignKey
ALTER TABLE `crm_vendor_contacts` ADD CONSTRAINT `crm_vendor_contacts_vendor_id_fkey` FOREIGN KEY (`vendor_id`) REFERENCES `crm_vendors`(`vendor_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `crm_orders` ADD CONSTRAINT `crm_orders_order_vendor_contact_id_fkey` FOREIGN KEY (`order_vendor_contact_id`) REFERENCES `crm_vendor_contacts`(`contact_id`) ON DELETE SET NULL ON UPDATE CASCADE;

