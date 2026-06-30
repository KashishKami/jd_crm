import { describe, it, expect } from 'vitest';
import { prisma } from '../lib/db';

describe('Database Connection Integration Test', () => {
  it('should connect to database and retrieve the seeded admin user with team info', async () => {
    const adminUser = await prisma.users.findFirst({
      where: {
        username: 'admin@gmail.com',
      },
      include: {
        team: true,
      },
    });

    expect(adminUser).toBeDefined();
    expect(adminUser?.name).toBe('Admin');
    expect(adminUser?.team).toBeDefined();
    expect(adminUser?.team.teamName).toBe('IT Park');
  });

  it('should fetch all three seeded teams', async () => {
    const teams = await prisma.crmTeams.findMany({
      orderBy: {
        teamId: 'asc',
      },
    });

    const teamNames = teams.map(t => t.teamName);
    expect(teamNames).toContain('IT Park');
    expect(teamNames).toContain('DB Park');
    expect(teamNames).toContain('Alex');
  });

  it('should seed crm_customers and crm_orders successfully', async () => {
    const customerCount = await prisma.crmCustomers.count();
    expect(customerCount).toBeGreaterThan(0);

    const firstCustomer = await prisma.crmCustomers.findFirst();
    expect(firstCustomer).not.toBeNull();
    expect(firstCustomer?.customerName).not.toBeNull();
    expect(firstCustomer?.customerName).not.toBe('');
  });

  it('should throw an error when querying dropped first_name column', async () => {
    await expect(
      prisma.$queryRawUnsafe('SELECT first_name FROM crm_customers LIMIT 1')
    ).rejects.toThrow();
  });

  it('should throw an error when querying dropped order_year column', async () => {
    await expect(
      prisma.$queryRawUnsafe('SELECT order_year FROM crm_orders LIMIT 1')
    ).rejects.toThrow();
  });

  it('should contain merged order_make_model values containing a space', async () => {
    const orders = await prisma.crmOrders.findMany({
      where: {
        orderMakeModel: {
          not: null,
        },
      },
      take: 1,
    });
    expect(orders.length).toBeGreaterThan(0);
    expect(orders[0].orderMakeModel).toContain(' ');
  });
});
