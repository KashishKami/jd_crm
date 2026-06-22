-- CreateTable
CREATE TABLE `admin` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL DEFAULT '',
    `password` VARCHAR(255) NOT NULL DEFAULT '',

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `uid` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(256) NOT NULL,
    `nickname` VARCHAR(111) NULL,
    `username` VARCHAR(55) NOT NULL,
    `email` VARCHAR(50) NULL,
    `mobile` VARCHAR(15) NULL,
    `gender` VARCHAR(1) NOT NULL DEFAULT '0',
    `password` VARCHAR(255) NULL,
    `status` INTEGER NULL DEFAULT 1,
    `age` INTEGER NULL,
    `designation` VARCHAR(255) NULL,
    `date_of_joining` DATE NULL,
    `agent_id` VARCHAR(25) NULL,
    `profile_image` VARCHAR(255) NULL,
    `user_permissions` VARCHAR(555) NULL,
    `agent_target` VARCHAR(11) NULL,
    `agent_salary` VARCHAR(11) NULL,
    `created` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`uid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users_profile` (
    `profile_id` INTEGER NOT NULL AUTO_INCREMENT,
    `profile_user_id` INTEGER NOT NULL,
    `profile_local_address` VARCHAR(255) NULL,
    `profile_permanent_address` VARCHAR(255) NULL,
    `profile_alternate_phone` VARCHAR(15) NULL,
    `profile_dob` DATE NULL,
    `profile_pan` VARCHAR(15) NULL,
    `profile_aadhar` VARCHAR(20) NULL,
    `profile_bank_account` VARCHAR(55) NULL,
    `profile_bank_name` VARCHAR(255) NULL,
    `profile_bank_address` VARCHAR(255) NULL,
    `profile_bank_branch` VARCHAR(255) NULL,
    `profile_bank_ifsc` VARCHAR(255) NULL,
    `profile_emergency_contact_name` VARCHAR(155) NULL,
    `profile_emergency_contact_relation` VARCHAR(55) NULL,
    `profile_emergency_contact_address` VARCHAR(255) NULL,
    `profile_emergency_contact_number` VARCHAR(20) NULL,
    `profile_emergency_contact_number2` VARCHAR(20) NULL,
    `profile_created_at` DATETIME(0) NULL,
    `profile_updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `users_profile_profile_user_id_key`(`profile_user_id`),
    PRIMARY KEY (`profile_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users_profile_academic` (
    `academic_id` INTEGER NOT NULL AUTO_INCREMENT,
    `academic_user_id` INTEGER NOT NULL,
    `academic_standard` VARCHAR(15) NULL,
    `academic_year_from` VARCHAR(15) NULL,
    `academic_year_to` VARCHAR(15) NULL,
    `academic_specialization` VARCHAR(255) NULL,
    `academic_institute` VARCHAR(255) NULL,
    `academic_created` DATE NULL,

    INDEX `users_profile_academic_academic_user_id_idx`(`academic_user_id`),
    PRIMARY KEY (`academic_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users_profile_professional` (
    `professional_id` INTEGER NOT NULL AUTO_INCREMENT,
    `professional_user_id` INTEGER NOT NULL,
    `professional_organization` VARCHAR(155) NULL,
    `professional_year_from` VARCHAR(15) NULL,
    `professional_year_to` VARCHAR(15) NULL,
    `professional_designation` VARCHAR(155) NULL,
    `professional_salary` VARCHAR(20) NULL,
    `professional_experiance` VARCHAR(155) NULL,
    `professional_created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `users_profile_professional_professional_user_id_idx`(`professional_user_id`),
    PRIMARY KEY (`professional_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `crm_designations` (
    `designation_id` INTEGER NOT NULL AUTO_INCREMENT,
    `designation_name` VARCHAR(155) NOT NULL,
    `designation_created` DATETIME(0) NOT NULL,
    `designation_updated` DATETIME(0) NULL,

    PRIMARY KEY (`designation_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `crm_attendance` (
    `att_id` INTEGER NOT NULL AUTO_INCREMENT,
    `agent_id` INTEGER NOT NULL,
    `agent_name` VARCHAR(55) NOT NULL,
    `attendance_status_id` INTEGER NOT NULL,
    `attendance_status_name` VARCHAR(55) NULL,
    `attendance_date` DATE NOT NULL,
    `attendance_marked_name` VARCHAR(55) NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NULL,

    INDEX `crm_attendance_agent_id_idx`(`agent_id`),
    INDEX `crm_attendance_attendance_date_idx`(`attendance_date`),
    PRIMARY KEY (`att_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `crm_gateway` (
    `gateway_id` INTEGER NOT NULL AUTO_INCREMENT,
    `gateway_name` VARCHAR(55) NOT NULL,
    `gateway_status` INTEGER NOT NULL DEFAULT 1,
    `gateway_created_at` DATETIME(0) NOT NULL,
    `gateway_updated_at` DATETIME(0) NOT NULL,

    PRIMARY KEY (`gateway_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `crm_vendors` (
    `vendor_id` INTEGER NOT NULL AUTO_INCREMENT,
    `vendor_name` VARCHAR(255) NOT NULL,
    `vendor_phone` VARCHAR(15) NOT NULL,
    `vendor_fax` VARCHAR(20) NULL,
    `vendor_email` VARCHAR(255) NULL,
    `vendor_contact_person` VARCHAR(255) NOT NULL,
    `vendor_remark` TEXT NULL,
    `vendor_status` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,

    PRIMARY KEY (`vendor_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `crm_customers` (
    `customer_id` INTEGER NOT NULL AUTO_INCREMENT,
    `first_name` VARCHAR(255) NOT NULL,
    `last_name` VARCHAR(255) NOT NULL,
    `customer_phone` VARCHAR(25) NULL,
    `customer_email` VARCHAR(255) NOT NULL,
    `customer_billing_address` VARCHAR(255) NULL,
    `customer_shipping_address` VARCHAR(255) NULL,
    `date_created` DATETIME(0) NULL,
    `date_updated` DATETIME(0) NULL,

    PRIMARY KEY (`customer_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `crm_customer_cards` (
    `card_id` INTEGER NOT NULL AUTO_INCREMENT,
    `card_customer_id` INTEGER NOT NULL,
    `customer_name_oncard` VARCHAR(155) NOT NULL,
    `customer_card_number` VARCHAR(25) NOT NULL,
    `customer_card_exp_date` VARCHAR(15) NOT NULL,
    `customer_card_cvv` VARCHAR(5) NULL,
    `customer_card_copy_status` VARCHAR(20) NULL,
    `customer_card_photo_status` VARCHAR(20) NULL,
    `customer_card_created_at` DATETIME(0) NULL,
    `customer_card_updated` DATETIME(0) NULL,

    INDEX `crm_customer_cards_card_customer_id_idx`(`card_customer_id`),
    PRIMARY KEY (`card_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `crm_orders` (
    `crm_order_id` INTEGER NOT NULL AUTO_INCREMENT,
    `order_customer_id` INTEGER NOT NULL,
    `order_year` VARCHAR(255) NULL,
    `order_make_model` VARCHAR(255) NULL,
    `order_part` VARCHAR(255) NULL,
    `order_part_size` VARCHAR(255) NULL,
    `order_quoted_miles` VARCHAR(255) NULL,
    `order_given_miles` VARCHAR(255) NULL,
    `order_vin` VARCHAR(255) NULL,
    `order_total_pitched` VARCHAR(25) NULL,
    `order_vendor_price` VARCHAR(25) NULL,
    `order_vendor_id` INTEGER NULL,
    `order_vendor_name` VARCHAR(255) NULL,
    `order_shipping_type` VARCHAR(255) NULL,
    `order_markup` VARCHAR(255) NULL,
    `order_payment_gateway` INTEGER NULL,
    `order_sales_agent_id` INTEGER NULL,
    `order_sales_agent_name` VARCHAR(55) NULL,
    `order_verifier_id` INTEGER NULL,
    `order_verifier_name` VARCHAR(55) NULL,
    `order_documentation` VARCHAR(255) NULL,
    `order_booked` VARCHAR(255) NULL,
    `order_amount_charged` VARCHAR(25) NULL,
    `order_tracking_number` VARCHAR(55) NULL,
    `order_delivery_status` VARCHAR(55) NULL,
    `order_qualified_incentive_status` VARCHAR(55) NULL,
    `order_qualified_incentive_amount` VARCHAR(55) NULL,
    `order_status` VARCHAR(55) NULL,
    `sale_status` VARCHAR(55) NULL,
    `order_current_status` VARCHAR(55) NULL,
    `order_current_status_update_date` DATETIME(0) NULL,
    `order_date` DATE NULL,
    `order_vendor_feedback` VARCHAR(25) NOT NULL DEFAULT 'Positive',
    `order_client_feedback` VARCHAR(25) NOT NULL DEFAULT 'Positive',
    `order_resolution` VARCHAR(25) NOT NULL DEFAULT 'Resolved',
    `order_created_date` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `order_updated_date` DATETIME(0) NOT NULL,

    INDEX `crm_orders_order_customer_id_idx`(`order_customer_id`),
    INDEX `crm_orders_order_sales_agent_id_idx`(`order_sales_agent_id`),
    INDEX `crm_orders_order_current_status_idx`(`order_current_status`),
    INDEX `crm_orders_sale_status_idx`(`sale_status`),
    PRIMARY KEY (`crm_order_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `crm_comments` (
    `comment_id` INTEGER NOT NULL AUTO_INCREMENT,
    `customer_id` INTEGER NOT NULL,
    `order_id` INTEGER NOT NULL,
    `comment` TEXT NOT NULL,
    `comment_image` VARCHAR(255) NULL,
    `comment_agent_id` INTEGER NOT NULL,
    `comment_agent_name` VARCHAR(55) NOT NULL,
    `comment_created_date` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `comment_updated_date` DATETIME(0) NULL,

    INDEX `crm_comments_order_id_idx`(`order_id`),
    INDEX `crm_comments_customer_id_idx`(`customer_id`),
    PRIMARY KEY (`comment_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `usercheck` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `logindate` VARCHAR(255) NOT NULL DEFAULT '',
    `logintime` VARCHAR(255) NOT NULL DEFAULT '',
    `user_id` INTEGER NULL,
    `username` VARCHAR(255) NULL,
    `email` VARCHAR(255) NOT NULL DEFAULT '',
    `ip` VARBINARY(16) NULL,
    `mac` VARBINARY(16) NULL,
    `city` VARCHAR(255) NULL,
    `country` VARCHAR(255) NULL,
    `logged_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `usercheck_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `users_profile` ADD CONSTRAINT `users_profile_profile_user_id_fkey` FOREIGN KEY (`profile_user_id`) REFERENCES `users`(`uid`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users_profile_academic` ADD CONSTRAINT `users_profile_academic_academic_user_id_fkey` FOREIGN KEY (`academic_user_id`) REFERENCES `users`(`uid`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users_profile_professional` ADD CONSTRAINT `users_profile_professional_professional_user_id_fkey` FOREIGN KEY (`professional_user_id`) REFERENCES `users`(`uid`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `crm_attendance` ADD CONSTRAINT `crm_attendance_agent_id_fkey` FOREIGN KEY (`agent_id`) REFERENCES `users`(`uid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `crm_customer_cards` ADD CONSTRAINT `crm_customer_cards_card_customer_id_fkey` FOREIGN KEY (`card_customer_id`) REFERENCES `crm_customers`(`customer_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `crm_orders` ADD CONSTRAINT `crm_orders_order_customer_id_fkey` FOREIGN KEY (`order_customer_id`) REFERENCES `crm_customers`(`customer_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `crm_orders` ADD CONSTRAINT `crm_orders_order_vendor_id_fkey` FOREIGN KEY (`order_vendor_id`) REFERENCES `crm_vendors`(`vendor_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `crm_orders` ADD CONSTRAINT `crm_orders_order_payment_gateway_fkey` FOREIGN KEY (`order_payment_gateway`) REFERENCES `crm_gateway`(`gateway_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `crm_orders` ADD CONSTRAINT `crm_orders_order_sales_agent_id_fkey` FOREIGN KEY (`order_sales_agent_id`) REFERENCES `users`(`uid`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `crm_orders` ADD CONSTRAINT `crm_orders_order_verifier_id_fkey` FOREIGN KEY (`order_verifier_id`) REFERENCES `users`(`uid`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `crm_comments` ADD CONSTRAINT `crm_comments_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `crm_customers`(`customer_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `crm_comments` ADD CONSTRAINT `crm_comments_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `crm_orders`(`crm_order_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `crm_comments` ADD CONSTRAINT `crm_comments_comment_agent_id_fkey` FOREIGN KEY (`comment_agent_id`) REFERENCES `users`(`uid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `usercheck` ADD CONSTRAINT `usercheck_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`uid`) ON DELETE SET NULL ON UPDATE CASCADE;
