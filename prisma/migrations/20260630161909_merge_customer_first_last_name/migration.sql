-- AlterTable
ALTER TABLE `crm_customers` ADD COLUMN `customer_name` VARCHAR(511) NULL;

-- Back-fill
UPDATE `crm_customers`
SET `customer_name` = TRIM(
  CONCAT(
    COALESCE(TRIM(`first_name`), ''),
    CASE
      WHEN TRIM(COALESCE(`first_name`, '')) != ''
      AND  TRIM(COALESCE(`last_name`, '')) != ''
      THEN ' '
      ELSE ''
    END,
    COALESCE(TRIM(`last_name`), '')
  )
);

-- AlterTable
ALTER TABLE `crm_customers` MODIFY COLUMN `customer_name` VARCHAR(511) NOT NULL,
    DROP COLUMN `first_name`,
    DROP COLUMN `last_name`;

