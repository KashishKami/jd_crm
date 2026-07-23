import { prisma } from '../lib/db';
import * as XLSX from 'xlsx';

function cleanDataForExcel(rows: unknown[]): object[] {
  return rows.map((row: any) => {
    if (!row || typeof row !== 'object') return row;
    const cleanRow: any = {};
    for (const [key, value] of Object.entries(row)) {
      if (typeof value === 'string' && value.length > 32767) {
        cleanRow[key] = value.substring(0, 32750) + '... [TRUNCATED]';
      } else {
        cleanRow[key] = value;
      }
    }
    return cleanRow;
  });
}

export async function buildFullExportWorkbook(): Promise<Buffer> {
  const [
    users,
    orders,
    customers,
    cards,
    vendors,
    gateways,
    followUps,
    dispositions,
    teams,
    roles,
    comments,
    attendance,
  ] = await Promise.all([
    prisma.users.findMany(),
    prisma.crmOrders.findMany(),
    prisma.crmCustomers.findMany(),
    prisma.crmCustomerCards.findMany(),
    prisma.crmVendors.findMany(),
    prisma.crmGateway.findMany(),
    prisma.crmFollowUps.findMany(),
    prisma.crmCallDispositions.findMany(),
    prisma.crmTeams.findMany(),
    prisma.crmRoles.findMany(),
    prisma.crmComments.findMany(),
    prisma.crmAttendance.findMany(),
  ]);

  const wb = XLSX.utils.book_new();

  const sheets: [unknown[], string][] = [
    [users, 'Agents'],
    [orders, 'Orders'],
    [customers, 'Customers'],
    [cards, 'Cards'],
    [vendors, 'Vendors'],
    [gateways, 'Gateways'],
    [followUps, 'Follow Ups'],
    [dispositions, 'Call Dispositions'],
    [teams, 'Teams'],
    [roles, 'Roles'],
    [comments, 'Comments'],
    [attendance, 'Attendance'],
  ];

  for (const [data, name] of sheets) {
    const cleaned = cleanDataForExcel(data);
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(cleaned), name);
  }

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
}
