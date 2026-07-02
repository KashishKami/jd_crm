/*
  Warnings:

  - You are about to drop the column `order_given_miles` on the `crm_orders` table. All the data in the column will be lost.
  - You are about to drop the column `order_quoted_miles` on the `crm_orders` table. All the data in the column will be lost.
  - You are about to alter the column `order_amount_charged` on the `crm_orders` table. The data in that column could be lost. The data in that column will be cast from `VarChar(255)` to `VarChar(25)`.

*/
-- AlterTable
ALTER TABLE `crm_orders` DROP COLUMN `order_given_miles`,
    DROP COLUMN `order_quoted_miles`,
    ADD COLUMN `order_checklist` VARCHAR(20) NULL DEFAULT 'No',
    ADD COLUMN `order_quoted_miles_and_warranty` VARCHAR(255) NULL,
    ADD COLUMN `order_vendor_miles_and_warranty` VARCHAR(255) NULL,
    MODIFY `order_amount_charged` VARCHAR(25) NULL;
