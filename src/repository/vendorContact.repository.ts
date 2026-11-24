import { prisma } from '../lib/db';
import { contactKey, splitContactNames } from '../lib/vendorContacts';

export interface VendorContactInput {
  contactName?: string;
  contactPhone?: string | null;
  contactEmail?: string | null;
  contactStatus?: number;
}

/** Contacts for one supplier, active first, then alphabetical. */
export async function findByVendor(vendorId: number, includeInactive = false) {
  const rows = await prisma.crmVendorContacts.findMany({
    where: { vendorId, ...(includeInactive ? {} : { contactStatus: 1 }) },
    include: { _count: { select: { orders: true } } },
  });
  return rows
    .map(({ _count, ...c }) => ({ ...c, orderCount: _count.orders }))
    .sort((a, b) => b.contactStatus - a.contactStatus || a.contactName.localeCompare(b.contactName));
}

export async function findById(contactId: number) {
  return prisma.crmVendorContacts.findUnique({ where: { contactId } });
}

export async function findByIds(contactIds: number[]) {
  if (contactIds.length === 0) return [];
  return prisma.crmVendorContacts.findMany({ where: { contactId: { in: contactIds } } });
}

/** Finds a contact at this supplier with the same name (ignoring case and extra spaces). */
export async function findByName(vendorId: number, name: string) {
  const all = await prisma.crmVendorContacts.findMany({ where: { vendorId } });
  const key = contactKey(name);
  return all.find(c => contactKey(c.contactName) === key) ?? null;
}

export async function create(vendorId: number, data: VendorContactInput & { contactName: string }) {
  return prisma.crmVendorContacts.create({
    data: {
      vendorId,
      contactName: data.contactName,
      contactPhone: data.contactPhone || null,
      contactEmail: data.contactEmail || null,
      contactStatus: data.contactStatus ?? 1,
    },
  });
}

export async function update(contactId: number, data: VendorContactInput) {
  return prisma.crmVendorContacts.update({ where: { contactId }, data });
}

/**
 * Makes sure every name in a legacy "A / B / C" contact field exists as a contact
 * for the supplier. Never removes or renames anything. Returns the names added.
 */
export async function ensureContactsFromLegacyField(vendorId: number, legacyField: string | null | undefined): Promise<string[]> {
  const names = splitContactNames(legacyField);
  if (names.length === 0) return [];
  const existing = await prisma.crmVendorContacts.findMany({ where: { vendorId }, select: { contactName: true } });
  const have = new Set(existing.map(c => contactKey(c.contactName)));
  const toAdd = names.filter(n => !have.has(contactKey(n)));
  if (toAdd.length > 0) {
    await prisma.crmVendorContacts.createMany({ data: toAdd.map(contactName => ({ vendorId, contactName })) });
  }
  return toAdd;
}
