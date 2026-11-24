import { vi, describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getServerSession } from 'next-auth';
import { prisma } from '../lib/db';
import { tidyContactName, splitContactNames, formatSupplierWithContact } from '../lib/vendorContacts';
import * as contactService from '../service/vendorContact.service';
import { ensureContactsFromLegacyField } from '../repository/vendorContact.repository';
import { createOrder, updateOrder, addPart } from '../service/order.service';
import { createVendor, updateVendor } from '../service/vendor.service';

vi.mock('next-auth', () => ({
  default: vi.fn(),
  getServerSession: vi.fn(),
}));

describe('supplier contact name helpers', () => {
  it('tidies names', () => {
    expect(tidyContactName('  josh ')).toBe('Josh');
    expect(tidyContactName('MIKE')).toBe('Mike');
    expect(tidyContactName('AJ')).toBe('AJ'); // short all-caps initials are kept
    expect(tidyContactName('McDonald')).toBe('McDonald');
    expect(tidyContactName('Jacob\t')).toBe('Jacob');
    expect(tidyContactName('mary-jane o\'neil')).toBe("Mary-Jane O'Neil");
  });

  it('splits the legacy "A / B / C" field into unique names', () => {
    expect(splitContactNames('Danny / Geremi / Mike')).toEqual(['Danny', 'Geremi', 'Mike']);
    expect(splitContactNames(' Dean / Simon / frank ')).toEqual(['Dean', 'Simon', 'Frank']);
    expect(splitContactNames('Jacob\t/ Austin')).toEqual(['Jacob', 'Austin']);
    expect(splitContactNames('Saul / saul / jeff')).toEqual(['Saul', 'Jeff']);
    expect(splitContactNames('na')).toEqual([]);
    expect(splitContactNames('')).toEqual([]);
    expect(splitContactNames(null)).toEqual([]);
  });

  it('formats supplier with contact', () => {
    expect(formatSupplierWithContact('XYZ Automotive', 'Max')).toBe('XYZ Automotive (Max)');
    expect(formatSupplierWithContact('XYZ Automotive', null)).toBe('XYZ Automotive');
    expect(formatSupplierWithContact(null, null)).toBe('');
  });

  it('applies the agreed permission rules', () => {
    expect(contactService.canAddContacts('orders:create')).toBe(true);
    expect(contactService.canAddContacts('orders:edit')).toBe(true);
    expect(contactService.canManageContacts('orders:edit')).toBe(false);
    expect(contactService.canManageContacts('vendors:edit')).toBe(true);
    expect(contactService.canViewContacts('orders:create')).toBe(true);
    expect(contactService.canViewContacts('vendors:edit')).toBe(true);
    expect(contactService.canViewContacts('reports:agent-sales')).toBe(false);
  });
});

describe('supplier contacts against the database', () => {
  let xyz: { vendorId: number };
  let other: { vendorId: number };
  let max: { contactId: number };
  let june: { contactId: number };
  let clay: { contactId: number };
  let otherPerson: { contactId: number };
  let agent: { uid: number; name: string };
  const orderIds: number[] = [];
  const customerIds: number[] = [];

  const baseOrder = {
    customerName: 'Contact Test Customer',
    customerEmail: 'contact.test@example.com',
    customerNameOncard: 'Contact Tester',
    customerCardNumber: '4111222233334444',
    customerCardExpDate: '12/28',
    orderMakeModel: '2014 Ford F150',
    orderTotalPitched: '1500',
    orderAmountCharged: '500',
  };

  beforeAll(async () => {
    const role = await prisma.crmRoles.findFirst();
    const team = await prisma.crmTeams.findFirst();
    const u = await prisma.users.create({
      data: { name: 'Contact Agent', username: 'contact_agent_test', teamId: team!.teamId, roleId: role!.roleId, status: 1 },
    });
    agent = { uid: u.uid, name: u.name };
    xyz = await prisma.crmVendors.create({ data: { vendorName: 'XYZ Automotive', vendorPhone: '5551112222', vendorContactPerson: 'Max' } });
    other = await prisma.crmVendors.create({ data: { vendorName: 'Other Salvage', vendorPhone: '5553334444', vendorContactPerson: 'Pat' } });
    max = (await contactService.addContact(xyz.vendorId, { contactName: 'Max' })).contact;
    june = (await contactService.addContact(xyz.vendorId, { contactName: 'June', contactPhone: '555-000-1111' })).contact;
    clay = (await contactService.addContact(xyz.vendorId, { contactName: 'Clay' })).contact;
    otherPerson = (await contactService.addContact(other.vendorId, { contactName: 'Pat' })).contact;
  });

  afterAll(async () => {
    const children = await prisma.crmOrders.findMany({ where: { parentOrderId: { in: orderIds } }, select: { crmOrderId: true } });
    const all = [...children.map(c => c.crmOrderId), ...orderIds];
    await prisma.crmOrderAuditLog.deleteMany({ where: { orderId: { in: all } } });
    await prisma.crmSaleStatusHistory.deleteMany({ where: { orderId: { in: all } } });
    await prisma.crmOrderCurrentStatusHistory.deleteMany({ where: { orderId: { in: all } } });
    for (const id of children.map(c => c.crmOrderId)) await prisma.crmOrders.delete({ where: { crmOrderId: id } });
    for (const id of orderIds) await prisma.crmOrders.delete({ where: { crmOrderId: id } });
    const orderCustomers = await prisma.crmCustomers.findMany({ where: { customerEmail: 'contact.test@example.com' }, select: { customerId: true } });
    customerIds.push(...orderCustomers.map(c => c.customerId));
    await prisma.crmCustomerCards.deleteMany({ where: { cardCustomerId: { in: customerIds } } });
    await prisma.crmCustomers.deleteMany({ where: { customerId: { in: customerIds } } });
    await prisma.crmVendors.deleteMany({ where: { vendorName: { in: ['XYZ Automotive', 'Other Salvage', 'Sync Supplier'] } } });
    await prisma.users.delete({ where: { uid: agent.uid } });
  });

  it('does not create a duplicate when the same name is added again, and reactivates it', async () => {
    const again = await contactService.addContact(xyz.vendorId, { contactName: '  max ' });
    expect(again.created).toBe(false);
    expect(again.contact.contactId).toBe(max.contactId);

    await contactService.updateContact(xyz.vendorId, clay.contactId, { contactStatus: 0 });
    expect((await contactService.listContacts(xyz.vendorId)).map(c => c.contactName)).toEqual(['June', 'Max']);
    const back = await contactService.addContact(xyz.vendorId, { contactName: 'Clay' });
    expect(back.created).toBe(false);
    expect(back.contact.contactStatus).toBe(1);
  });

  it('validates names, emails and renames', async () => {
    await expect(contactService.addContact(xyz.vendorId, { contactName: '   ' })).rejects.toThrow('Contact name is required');
    await expect(contactService.addContact(xyz.vendorId, { contactName: 'Zed', contactEmail: 'not-an-email' })).rejects.toThrow('Email address looks invalid');
    await expect(contactService.updateContact(xyz.vendorId, june.contactId, { contactName: 'max' })).rejects.toThrow('Max already exists at this supplier');
    await expect(contactService.updateContact(other.vendorId, june.contactId, { contactName: 'Junie' })).rejects.toThrow('Contact not found');
    await expect(contactService.addContact(999999, { contactName: 'Ghost' })).rejects.toThrow('Supplier not found');
  });

  it('records a different contact per order at the same supplier', async () => {
    const a = await createOrder({ ...baseOrder, orderPart: 'Engine', orderVendorId: xyz.vendorId, orderVendorContactId: max.contactId }, agent);
    const b = await createOrder({ ...baseOrder, orderPart: 'Engine', orderVendorId: xyz.vendorId, orderVendorContactId: june.contactId }, agent);
    const c = await createOrder({ ...baseOrder, orderPart: 'Engine', orderVendorId: xyz.vendorId }, agent);
    orderIds.push(a.orderId, b.orderId, c.orderId);

    const rows = await prisma.crmOrders.findMany({ where: { crmOrderId: { in: [a.orderId, b.orderId, c.orderId] } }, orderBy: { crmOrderId: 'asc' } });
    expect(rows.map(r => [r.orderVendorName, r.orderVendorContactName])).toEqual([
      ['XYZ Automotive', 'Max'],
      ['XYZ Automotive', 'June'],
      ['XYZ Automotive', null], // contact is optional
    ]);
  });

  it('saves a contact on each part of a multi-part order', async () => {
    const res = await createOrder(
      {
        ...baseOrder,
        parts: [
          { orderPart: 'Engine', orderVendorId: xyz.vendorId, orderVendorContactId: max.contactId },
          { orderPart: 'Transmission', orderVendorId: xyz.vendorId, orderVendorContactId: clay.contactId },
          { orderPart: 'Transfer Case', orderVendorId: other.vendorId, orderVendorContactId: otherPerson.contactId },
        ],
      } as any,
      agent,
    );
    orderIds.push(res.orderId);
    const children = await prisma.crmOrders.findMany({ where: { parentOrderId: res.orderId }, orderBy: { crmOrderId: 'asc' } });
    const parent = await prisma.crmOrders.findUnique({ where: { crmOrderId: res.orderId } });
    expect(parent!.orderVendorContactName).toBe('Max');
    expect(children.map(c => c.orderVendorContactName)).toEqual(['Clay', 'Pat']);
  });

  it('rejects a contact that belongs to a different supplier', async () => {
    await expect(
      createOrder({ ...baseOrder, orderPart: 'Engine', orderVendorId: other.vendorId, orderVendorContactId: max.contactId }, agent),
    ).rejects.toThrow('Max is not a contact at the selected supplier');
  });

  it('updates, audits and clears the contact on edit', async () => {
    const created = await createOrder({ ...baseOrder, orderPart: 'Engine', orderVendorId: xyz.vendorId, orderVendorContactId: max.contactId }, agent);
    orderIds.push(created.orderId);

    await updateOrder(created.orderId, { orderVendorId: xyz.vendorId, orderVendorContactId: june.contactId }, agent.uid, agent.name);
    let row = await prisma.crmOrders.findUnique({ where: { crmOrderId: created.orderId } });
    expect(row!.orderVendorContactName).toBe('June');
    const audit = await prisma.crmOrderAuditLog.findMany({ where: { orderId: created.orderId, fieldName: 'orderVendorContactName' } });
    expect(audit.map(a => [a.oldValue, a.newValue])).toEqual([['Max', 'June']]);

    // Contact from another supplier is refused
    await expect(
      updateOrder(created.orderId, { orderVendorContactId: otherPerson.contactId }, agent.uid, agent.name),
    ).rejects.toThrow('Pat is not a contact at the selected supplier');

    // Switching supplier without picking a contact clears the old one
    await updateOrder(created.orderId, { orderVendorId: other.vendorId }, agent.uid, agent.name);
    row = await prisma.crmOrders.findUnique({ where: { crmOrderId: created.orderId } });
    expect(row!.orderVendorName).toBe('Other Salvage');
    expect(row!.orderVendorContactId).toBeNull();
    expect(row!.orderVendorContactName).toBeNull();

    // Edits that don't mention the supplier leave the contact alone
    await updateOrder(created.orderId, { orderVendorId: other.vendorId, orderVendorContactId: otherPerson.contactId }, agent.uid, agent.name);
    await updateOrder(created.orderId, { orderTrackingNumber: '1Z999' }, agent.uid, agent.name);
    row = await prisma.crmOrders.findUnique({ where: { crmOrderId: created.orderId } });
    expect(row!.orderVendorContactName).toBe('Pat');
  });

  it('keeps the saved name on old orders after a contact is renamed', async () => {
    const created = await createOrder({ ...baseOrder, orderPart: 'Engine', orderVendorId: xyz.vendorId, orderVendorContactId: clay.contactId }, agent);
    orderIds.push(created.orderId);
    await contactService.updateContact(xyz.vendorId, clay.contactId, { contactName: 'Clayton' });
    const row = await prisma.crmOrders.findUnique({ where: { crmOrderId: created.orderId } });
    expect(row!.orderVendorContactName).toBe('Clay');
    // Re-saving the same contact keeps the original snapshot
    await updateOrder(created.orderId, { orderVendorId: xyz.vendorId, orderVendorContactId: clay.contactId }, agent.uid, agent.name);
    expect((await prisma.crmOrders.findUnique({ where: { crmOrderId: created.orderId } }))!.orderVendorContactName).toBe('Clay');
  });

  it('records the contact on a part added to an existing order', async () => {
    const created = await createOrder({ ...baseOrder, orderPart: 'Engine', orderVendorId: xyz.vendorId }, agent);
    orderIds.push(created.orderId);
    const part = await addPart(created.orderId, { orderPart: 'Radiator', orderVendorId: xyz.vendorId, orderVendorContactId: june.contactId }, agent);
    const row = await prisma.crmOrders.findUnique({ where: { crmOrderId: (part as any).partOrderId ?? (part as any).crmOrderId } });
    expect(row!.orderVendorContactName).toBe('June');
    await expect(
      addPart(created.orderId, { orderPart: 'Hood', orderVendorId: other.vendorId, orderVendorContactId: june.contactId }, agent),
    ).rejects.toThrow('June is not a contact at the selected supplier');
  });

  it('keeps contacts in step with the vendor "Contact Person" field', async () => {
    const v = await createVendor({ vendorName: 'Sync Supplier', vendorPhone: '5559990000', vendorContactPerson: 'Ann / bob' } as any);
    expect((await contactService.listContacts(v.vendorId)).map(c => c.contactName)).toEqual(['Ann', 'Bob']);
    await updateVendor(v.vendorId, { vendorContactPerson: 'Ann / Bob / Cy' } as any);
    expect((await contactService.listContacts(v.vendorId)).map(c => c.contactName)).toEqual(['Ann', 'Bob', 'Cy']);
    // Removing a name from the field never deletes the contact
    await updateVendor(v.vendorId, { vendorContactPerson: 'Ann' } as any);
    expect((await contactService.listContacts(v.vendorId)).length).toBe(3);
    expect(await ensureContactsFromLegacyField(v.vendorId, 'Ann / Bob')).toEqual([]);
  });

  describe('API', () => {
    const session = (perms: string) => ({ user: { id: String(agent.uid), name: 'T', userPermissions: perms } });

    it('lists contacts for order users, hides deactivated ones unless they can manage', async () => {
      const { GET } = await import('../app/api/vendors/[id]/contacts/route');
      const params = { params: Promise.resolve({ id: String(xyz.vendorId) }) };

      vi.mocked(getServerSession).mockResolvedValueOnce(null);
      expect((await GET(new Request('http://x/api'), params)).status).toBe(401);

      vi.mocked(getServerSession).mockResolvedValueOnce(session('reports:agent-sales'));
      expect((await GET(new Request('http://x/api'), params)).status).toBe(403);

      await contactService.updateContact(xyz.vendorId, june.contactId, { contactStatus: 0 });
      vi.mocked(getServerSession).mockResolvedValueOnce(session('orders:create'));
      let res = await GET(new Request('http://x/api?includeInactive=1'), params);
      expect((await res.json()).map((c: { contactName: string }) => c.contactName)).not.toContain('June');

      vi.mocked(getServerSession).mockResolvedValueOnce(session('vendors:edit'));
      res = await GET(new Request('http://x/api?includeInactive=1'), params);
      expect((await res.json()).map((c: { contactName: string }) => c.contactName)).toContain('June');
      await contactService.updateContact(xyz.vendorId, june.contactId, { contactStatus: 1 });
    });

    it('lets order users add contacts but only vendor editors rename/deactivate', async () => {
      const { POST } = await import('../app/api/vendors/[id]/contacts/route');
      const { PATCH } = await import('../app/api/vendors/[id]/contacts/[contactId]/route');
      const params = { params: Promise.resolve({ id: String(xyz.vendorId) }) };
      const body = (b: object) => new Request('http://x/api', { method: 'POST', body: JSON.stringify(b) });

      vi.mocked(getServerSession).mockResolvedValueOnce(session('orders:view'));
      expect((await POST(body({ contactName: 'Sara' }), params)).status).toBe(403);

      vi.mocked(getServerSession).mockResolvedValueOnce(session('orders:create'));
      let res = await POST(body({ contactName: 'Sara' }), params);
      expect(res.status).toBe(201);
      const sara = await res.json();

      vi.mocked(getServerSession).mockResolvedValueOnce(session('orders:create'));
      res = await POST(body({ contactName: 'sara' }), params);
      expect(res.status).toBe(200);
      expect((await res.json()).contactId).toBe(sara.contactId);

      vi.mocked(getServerSession).mockResolvedValueOnce(session('orders:create'));
      res = await POST(body({ contactName: '' }), params);
      expect(res.status).toBe(400);

      const patchParams = { params: Promise.resolve({ id: String(xyz.vendorId), contactId: String(sara.contactId) }) };
      const patch = (b: object) => new Request('http://x/api', { method: 'PATCH', body: JSON.stringify(b) });

      vi.mocked(getServerSession).mockResolvedValueOnce(session('orders:create,orders:edit'));
      expect((await PATCH(patch({ contactStatus: 0 }), patchParams)).status).toBe(403);

      vi.mocked(getServerSession).mockResolvedValueOnce(session('vendors:edit'));
      res = await PATCH(patch({ contactName: 'Sarah', contactStatus: 0 }), patchParams);
      expect(res.status).toBe(200);
      expect(await res.json()).toMatchObject({ contactName: 'Sarah', contactStatus: 0 });

      vi.mocked(getServerSession).mockResolvedValueOnce(session('vendors:edit'));
      const wrongVendor = { params: Promise.resolve({ id: String(other.vendorId), contactId: String(sara.contactId) }) };
      expect((await PATCH(patch({ contactName: 'X' }), wrongVendor)).status).toBe(404);
    });
  });
});
