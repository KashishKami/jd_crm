// Copies each supplier's legacy "Contact Person" field into crm_vendor_contacts.
//
// NOTE: deploys don't need this — the migration
// prisma/migrations/20261124130000_backfill_vendor_contacts does the same copy
// automatically. Keep this script for local use or to re-sync by hand.
//
//   "Danny / Geremi / Mike"  →  three contacts: Danny, Geremi, Mike
//
// It only ADDS contacts that don't already exist (matched by name, ignoring
// case and spaces). It never edits vendors, removes contacts or touches orders.
//
// Usage:  npm run migrate:vendor-contacts
//         npm run migrate:vendor-contacts -- --dry-run   (show what would be added)

import fs from 'node:fs';

if (!process.env.DATABASE_URL && fs.existsSync('.env')) {
  process.loadEnvFile();
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const { prisma } = await import('../lib/db');
  const { splitContactNames, contactKey } = await import('../lib/vendorContacts');
  const { ensureContactsFromLegacyField } = await import('../repository/vendorContact.repository');

  const vendors = await prisma.crmVendors.findMany({
    select: { vendorId: true, vendorName: true, vendorContactPerson: true },
    orderBy: { vendorId: 'asc' },
  });

  let added = 0;
  let suppliersTouched = 0;
  for (const v of vendors) {
    let names: string[];
    if (dryRun) {
      const existing = await prisma.crmVendorContacts.findMany({ where: { vendorId: v.vendorId }, select: { contactName: true } });
      const have = new Set(existing.map(c => contactKey(c.contactName)));
      names = splitContactNames(v.vendorContactPerson).filter(n => !have.has(contactKey(n)));
    } else {
      names = await ensureContactsFromLegacyField(v.vendorId, v.vendorContactPerson);
    }
    if (names.length > 0) {
      suppliersTouched++;
      added += names.length;
      console.log(`${dryRun ? '[dry run] ' : ''}${v.vendorName.trim()}: ${names.join(', ')}`);
    }
  }

  console.log(`\n${dryRun ? 'Would add' : 'Added'} ${added} contact(s) across ${suppliersTouched} supplier(s) (${vendors.length} suppliers checked).`);
  await prisma.$disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
