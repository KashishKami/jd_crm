import { hasPermission } from './permission.service';
import * as vendorContactRepository from '../repository/vendorContact.repository';
import { prisma } from '../lib/db';
import { tidyContactName } from '../lib/vendorContacts';

// ─── Permission rules ───────────────────────────────────────────────────────
//   • See contacts:            anyone who can work with orders or vendors
//   • Add a contact:           anyone who can create/edit orders (from the order form) or edit vendors
//   • Rename / deactivate:     vendors:edit only

type Perms = string | string[] | null | undefined;

export const canViewContacts = (p: Perms) =>
  hasPermission(p, 'vendors:view') ||
  hasPermission(p, 'vendors:edit') ||
  hasPermission(p, 'vendors:create') ||
  hasPermission(p, 'orders:create') ||
  hasPermission(p, 'orders:edit') ||
  hasPermission(p, 'orders:view');

export const canAddContacts = (p: Perms) =>
  hasPermission(p, 'orders:create') || hasPermission(p, 'orders:edit') || hasPermission(p, 'vendors:edit') || hasPermission(p, 'vendors:create');

export const canManageContacts = (p: Perms) => hasPermission(p, 'vendors:edit');

export class ContactError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function cleanOptional(v: unknown, max: number, label: string): string | null | undefined {
  if (v === undefined) return undefined;
  if (v === null) return null;
  const s = String(v).trim();
  if (!s) return null;
  if (s.length > max) throw new ContactError(`${label} is too long`);
  return s;
}

function validateFields(input: { contactName?: unknown; contactPhone?: unknown; contactEmail?: unknown }, requireName: boolean) {
  let contactName: string | undefined;
  if (input.contactName !== undefined || requireName) {
    contactName = tidyContactName(String(input.contactName ?? ''));
    if (!contactName) throw new ContactError('Contact name is required');
    if (contactName.length > 255) throw new ContactError('Contact name is too long');
  }
  const contactPhone = cleanOptional(input.contactPhone, 25, 'Phone');
  const contactEmail = cleanOptional(input.contactEmail, 255, 'Email');
  if (contactEmail && !EMAIL_RE.test(contactEmail)) throw new ContactError('Email address looks invalid');
  return { contactName, contactPhone, contactEmail };
}

async function requireVendor(vendorId: number) {
  const vendor = await prisma.crmVendors.findUnique({ where: { vendorId }, select: { vendorId: true } });
  if (!vendor) throw new ContactError('Supplier not found', 404);
}

export async function listContacts(vendorId: number, includeInactive = false) {
  await requireVendor(vendorId);
  return vendorContactRepository.findByVendor(vendorId, includeInactive);
}

/**
 * Adds a contact to a supplier. If someone with the same name already exists
 * there, that contact is returned instead (and reactivated if it was turned off),
 * so typing "max" on the order form never creates a second "Max".
 */
export async function addContact(vendorId: number, input: { contactName?: unknown; contactPhone?: unknown; contactEmail?: unknown }) {
  await requireVendor(vendorId);
  const { contactName, contactPhone, contactEmail } = validateFields(input, true);
  const existing = await vendorContactRepository.findByName(vendorId, contactName!);
  if (existing) {
    const contact = existing.contactStatus === 1 ? existing : await vendorContactRepository.update(existing.contactId, { contactStatus: 1 });
    return { contact, created: false };
  }
  const contact = await vendorContactRepository.create(vendorId, {
    contactName: contactName!,
    contactPhone: contactPhone ?? null,
    contactEmail: contactEmail ?? null,
  });
  return { contact, created: true };
}

export async function updateContact(
  vendorId: number,
  contactId: number,
  input: { contactName?: unknown; contactPhone?: unknown; contactEmail?: unknown; contactStatus?: unknown },
) {
  const contact = await vendorContactRepository.findById(contactId);
  if (!contact || contact.vendorId !== vendorId) throw new ContactError('Contact not found', 404);

  const { contactName, contactPhone, contactEmail } = validateFields(input, false);
  const data: { contactName?: string; contactPhone?: string | null; contactEmail?: string | null; contactStatus?: number } = {};

  if (contactName !== undefined && contactName !== contact.contactName) {
    const clash = await vendorContactRepository.findByName(vendorId, contactName);
    if (clash && clash.contactId !== contactId) {
      throw new ContactError(`${clash.contactName} already exists at this supplier`, 409);
    }
    data.contactName = contactName;
  }
  if (contactPhone !== undefined) data.contactPhone = contactPhone;
  if (contactEmail !== undefined) data.contactEmail = contactEmail;
  if (input.contactStatus !== undefined) {
    const status = Number(input.contactStatus);
    if (status !== 0 && status !== 1) throw new ContactError('Invalid status');
    data.contactStatus = status;
  }
  return vendorContactRepository.update(contactId, data);
}

/**
 * Resolves the contact to store on an order part. Returns null when no contact
 * is given. Throws if the contact belongs to a different supplier.
 */
export async function resolveContactForOrder(contactId: number | null | undefined, vendorId: number | null | undefined) {
  if (!contactId) return null;
  const contact = await vendorContactRepository.findById(contactId);
  if (!contact) throw new ContactError('Supplier contact not found');
  if (!vendorId || contact.vendorId !== vendorId) {
    throw new ContactError(`${contact.contactName} is not a contact at the selected supplier`);
  }
  return contact;
}
