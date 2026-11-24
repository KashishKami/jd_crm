-- Backfill supplier contacts from each supplier's legacy "Contact Person" field.
--
--   "Danny / Geremi / Mike"  →  three contacts: Danny, Geremi, Mike
--
-- Names are trimmed (tabs/newlines become spaces), placeholders like "na" are
-- skipped, and all-lowercase or ALL-CAPS names get a capital first letter
-- ("josh" → "Josh", "MIKE" → "Mike"). Matches src/lib/vendorContacts.ts.
--
-- Safe to run on a database that already has contacts: a name is only added
-- if that supplier doesn't already have a contact with the same name
-- (the column collation is case-insensitive). Nothing is updated or deleted.

INSERT INTO `crm_vendor_contacts` (`vendor_id`, `contact_name`, `contact_status`, `created_at`, `updated_at`)
SELECT n.vendor_id, n.contact_name, 1, NOW(), NOW()
FROM (
  SELECT DISTINCT d.vendor_id, d.contact_name
  FROM (
    SELECT v.vendor_id,
      CASE
        WHEN BINARY TRIM(jt.raw_name) = BINARY LOWER(TRIM(jt.raw_name))
          OR (BINARY TRIM(jt.raw_name) = BINARY UPPER(TRIM(jt.raw_name)) AND CHAR_LENGTH(TRIM(jt.raw_name)) > 2)
        THEN CONCAT(UPPER(LEFT(TRIM(jt.raw_name), 1)), LOWER(SUBSTRING(TRIM(jt.raw_name), 2)))
        ELSE TRIM(jt.raw_name)
      END AS contact_name
    FROM `crm_vendors` v
    JOIN JSON_TABLE(
      CONCAT('["', REPLACE(
        REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(COALESCE(v.vendor_contact_person, ''), '\\', '\\\\'), '"', '\\"'), '\t', ' '), '\r', ' '), '\n', ' '),
        '/', '","'), '"]'),
      '$[*]' COLUMNS (raw_name VARCHAR(255) CHARACTER SET utf8mb4 PATH '$')
    ) jt
    WHERE TRIM(jt.raw_name) <> ''
      AND LOWER(TRIM(jt.raw_name)) NOT IN ('na', 'n/a', 'none', '-', '--', 'unknown', 'tbd')
  ) d
) n
WHERE NOT EXISTS (
  SELECT 1 FROM `crm_vendor_contacts` c
  WHERE c.vendor_id = n.vendor_id
    -- Explicit collation: the connection's default can differ from the table's
    AND c.contact_name = (n.contact_name COLLATE utf8mb4_unicode_ci)
);
