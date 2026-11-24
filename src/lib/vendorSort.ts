// ─── Supplier name sorting & search ─────────────────────────────────────────
// Many supplier names were imported with stray spaces/tabs (e.g. " Ford Auto
// Wrecking USA-CA"), so a plain database ORDER BY puts them first. These
// helpers sort A–Z ignoring surrounding whitespace and letter case, with
// numbers in natural order ("3 Sons" before "5 J's").

const collator = new Intl.Collator('en', { sensitivity: 'base', numeric: true });

/** Collapses runs of whitespace (incl. tabs) and trims. */
export const cleanVendorName = (name: string | null | undefined) => (name || '').replace(/\s+/g, ' ').trim();

export function compareVendorNames(a: string | null | undefined, b: string | null | undefined): number {
  return collator.compare(cleanVendorName(a), cleanVendorName(b));
}

export function sortVendorsByName<T extends { vendorName: string | null }>(vendors: T[]): T[] {
  return [...vendors].sort((a, b) => compareVendorNames(a.vendorName, b.vendorName));
}

/** Normalises the search box input: trimmed, max 100 chars, empty → undefined. */
export function normalizeVendorSearch(raw: string | null | undefined): string | undefined {
  const q = cleanVendorName(raw).slice(0, 100);
  return q || undefined;
}
