import { vi, describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getServerSession } from 'next-auth';
import { prisma } from '../lib/db';
import { compareVendorNames, sortVendorsByName, cleanVendorName, normalizeVendorSearch } from '../lib/vendorSort';
import { getAllVendors, createVendor, updateVendor } from '../service/vendor.service';

vi.mock('next-auth', () => ({
  default: vi.fn(),
  getServerSession: vi.fn(),
}));

describe('vendor name sorting', () => {
  it('sorts A–Z ignoring stray spaces, tabs and case, with numbers in natural order', () => {
    const names = ['Zed Parts', ' Ford Auto Wrecking USA-CA', 'bj used autoparts', '5 J\'s Auto Parts', 'ABC Auto Salvage \t', '3 Sons Auto', 'Bob\'s Auto Salvage', 'abc auto parts'];
    expect(sortVendorsByName(names.map(vendorName => ({ vendorName }))).map(v => v.vendorName)).toEqual([
      '3 Sons Auto',
      '5 J\'s Auto Parts',
      'abc auto parts',
      'ABC Auto Salvage \t',
      'bj used autoparts',
      'Bob\'s Auto Salvage',
      ' Ford Auto Wrecking USA-CA',
      'Zed Parts',
    ]);
    expect(compareVendorNames('  apple', 'Apple')).toBe(0);
  });

  it('cleans names and search input', () => {
    expect(cleanVendorName('  Fierge Auto Parts USA-IL \t')).toBe('Fierge Auto Parts USA-IL');
    expect(normalizeVendorSearch('   ')).toBeUndefined();
    expect(normalizeVendorSearch('  max ')).toBe('max');
    expect(normalizeVendorSearch('x'.repeat(300))!.length).toBe(100);
  });
});

describe('vendor directory search and order', () => {
  const NAMES = ['Zz Dir Test Salvage', '  Aa Dir Test Parts', 'Mm Dir Test Wrecking\t'];
  const ids: number[] = [];

  beforeAll(async () => {
    for (const [i, name] of NAMES.entries()) {
      const v = await prisma.crmVendors.create({
        data: {
          vendorName: name,
          vendorPhone: `555-010-000${i}`,
          vendorEmail: `dirtest${i}@example.com`,
          vendorContactPerson: i === 2 ? 'Quentin' : 'Pat',
          vendorStatus: 1,
        },
      });
      ids.push(v.vendorId);
    }
    // A contact that only lives in the contacts table (not the legacy field)
    await prisma.crmVendorContacts.create({ data: { vendorId: ids[0], contactName: 'Xavierdirtest' } });
  });

  afterAll(async () => {
    await prisma.crmVendors.deleteMany({ where: { vendorId: { in: ids } } });
    await prisma.crmVendors.deleteMany({ where: { vendorName: { contains: 'Trim Dir Test' } } });
  });

  const names = (rows: { vendorName: string }[]) => rows.map(v => v.vendorName);

  it('returns vendors sorted A–Z across pages', async () => {
    const all = (await getAllVendors(1)) as { vendorName: string }[];
    const sorted = [...all].sort((a, b) => compareVendorNames(a.vendorName, b.vendorName));
    expect(names(all)).toEqual(names(sorted));

    const page1 = await getAllVendors(1, 1, 2);
    const page2 = await getAllVendors(1, 2, 2);
    expect(names([...page1.data, ...page2.data])).toEqual(names(all).slice(0, 4));
    expect(page1.total).toBe(all.length);
    expect(page1.pages).toBe(Math.ceil(all.length / 2));
  });

  it('searches by name, legacy contact field, contacts table, phone and email (case-insensitive)', async () => {
    expect(names(await getAllVendors(1, undefined, undefined, 'dir test'))).toEqual(['  Aa Dir Test Parts', 'Mm Dir Test Wrecking\t', 'Zz Dir Test Salvage']);
    expect(names(await getAllVendors(1, undefined, undefined, 'QUENTIN'))).toEqual(['Mm Dir Test Wrecking\t']);
    expect(names(await getAllVendors(1, undefined, undefined, 'xavierdirtest'))).toEqual(['Zz Dir Test Salvage']);
    expect(names(await getAllVendors(1, undefined, undefined, '555-010-0001'))).toEqual(['  Aa Dir Test Parts']);
    expect(names(await getAllVendors(1, undefined, undefined, 'dirtest2@'))).toEqual(['Mm Dir Test Wrecking\t']);
    expect(await getAllVendors(1, undefined, undefined, 'no-such-vendor-zzz')).toEqual([]);
    // Search respects the Active / Blacklisted tab
    expect(await getAllVendors(0, undefined, undefined, 'dir test')).toEqual([]);
  });

  it('paginates search results', async () => {
    const res = await getAllVendors(1, 2, 2, 'dir test');
    expect(res.total).toBe(3);
    expect(res.pages).toBe(2);
    expect(names(res.data)).toEqual(['Zz Dir Test Salvage']);
  });

  it('passes the search box through the API', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({ user: { id: '1', name: 'T', userPermissions: 'vendors:view' } });
    const { GET } = await import('../app/api/vendors/route');
    const res = await GET(new Request('http://x/api/vendors?status=1&page=1&limit=20&search=quentin'));
    const body = await res.json();
    expect(body.total).toBe(1);
    expect(body.data[0].vendorName).toBe('Mm Dir Test Wrecking\t');
  });

  it('trims supplier names when they are saved', async () => {
    const v = await createVendor({ vendorName: '  Trim Dir Test Co \t', vendorPhone: '5550109999', vendorContactPerson: 'Ann' } as any);
    expect(v.vendorName).toBe('Trim Dir Test Co');
    const u = await updateVendor(v.vendorId, { vendorName: 'Trim Dir Test   Company ' } as any);
    expect(u.vendorName).toBe('Trim Dir Test Company');
  });
});
