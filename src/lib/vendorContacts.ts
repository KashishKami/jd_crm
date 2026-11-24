// ─── Supplier contact name helpers ──────────────────────────────────────────
// The legacy `vendor_contact_person` field holds one or more names separated by
// "/" (e.g. "Danny / Geremi / Mike"). These helpers turn that into individual,
// tidied contact names.

/** Trims stray whitespace/tabs and fixes all-lowercase or ALL-CAPS names ("josh" → "Josh", "MIKE" → "Mike"). */
export function tidyContactName(raw: string): string {
  const name = raw.replace(/\s+/g, ' ').trim();
  if (!name) return '';
  const hasLetters = /[a-z]/i.test(name);
  if (!hasLetters) return name;
  const isAllLower = name === name.toLowerCase();
  const isAllUpper = name === name.toUpperCase() && name.replace(/[^a-z]/gi, '').length > 2;
  if (!isAllLower && !isAllUpper) return name;
  return name.toLowerCase().replace(/(^|[\s\-'])([a-z])/g, (_m, p, c) => p + c.toUpperCase());
}

const PLACEHOLDERS = new Set(['na', 'n/a', 'none', '-', '--', 'unknown', 'tbd']);

/** Splits a legacy "A / B / C" contact field into unique, tidied names. */
export function splitContactNames(raw: string | null | undefined): string[] {
  if (!raw) return [];
  const seen = new Set<string>();
  const names: string[] = [];
  for (const part of raw.split('/')) {
    const name = tidyContactName(part);
    const key = name.toLowerCase();
    if (!name || PLACEHOLDERS.has(key) || seen.has(key)) continue;
    seen.add(key);
    names.push(name);
  }
  return names;
}

/** Case- and space-insensitive key for comparing contact names. */
export const contactKey = (name: string) => name.replace(/\s+/g, ' ').trim().toLowerCase();

/** "XYZ Automotive (Max)" — or just the supplier name when no contact is recorded. */
export function formatSupplierWithContact(vendorName: string | null | undefined, contactName: string | null | undefined): string {
  const v = (vendorName || '').trim();
  const c = (contactName || '').trim();
  if (v && c) return `${v} (${c})`;
  return v || c;
}
