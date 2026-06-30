-- Step 1: Back-fill: prepend year to make_model for all rows that have a non-null, non-empty order_year
UPDATE crm_orders
SET order_make_model = TRIM(
  CONCAT(
    COALESCE(TRIM(order_year), ''),
    CASE
      WHEN TRIM(COALESCE(order_year, '')) != ''
      AND  TRIM(COALESCE(order_make_model, '')) != ''
      THEN ' '
      ELSE ''
    END,
    COALESCE(TRIM(order_make_model), '')
  )
)
WHERE order_year IS NOT NULL AND TRIM(order_year) != '';

-- Step 2: Drop the now-redundant column
ALTER TABLE crm_orders DROP COLUMN order_year;
