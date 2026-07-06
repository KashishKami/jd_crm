import { describe, it, expect } from 'vitest';
import { prisma } from '../lib/db';
import { execSync } from 'child_process';

describe('Database Permission Seeding Sequential Order', () => {
  it('should have all crm_permissions seeded in perfect sequence from 1 to 54', async () => {
    const permissions = await prisma.crmPermissions.findMany({
      orderBy: { permissionId: 'asc' },
    });
    expect(permissions.length).toBe(54);
    for (let i = 0; i < permissions.length; i++) {
      expect(permissions[i].permissionId).toBe(i + 1);
    }
  });
});

describe('CSV Importer Integration Test (W-1808)', () => {
  it('should run the CSV importer script, parsing all columns and populating the database cleanly', async () => {
    try {
      try {
        execSync('npx tsx src/scripts/import-csv-data.ts', { stdio: 'inherit' });
      } catch (error) {
        throw new Error(`CSV Importer execution failed: ${error}`);
      }

      // Verify orders are populated
      const ordersCount = await prisma.crmOrders.count();
      expect(ordersCount).toBeGreaterThan(0);

      // Fetch a sample populated order to verify column mappings
      const sampleOrder = await prisma.crmOrders.findFirst({
        where: {
          orderMakeModel: '2017 Jeep Renegade',
        },
        include: {
          customer: {
            include: {
              cards: true,
            }
          }
        }
      });

      expect(sampleOrder).not.toBeNull();
      // Index 14 "Quoted Miles" was "89k/3 Months"
      expect(sampleOrder?.orderQuotedMilesAndWarranty).toBe('89k/3 Months');
      // Index 15 "Vendor Miles" was "130k/60 days"
      expect(sampleOrder?.orderVendorMilesAndWarranty).toBe('130k/60 days');
      // Index 26 "Backend Executive" was "Jeff"
      expect(sampleOrder?.orderBackendExecutiveName).toBe('Jeff');
      // Index 27 "QA Verifier" was "NA" (mapped to null)
      expect(sampleOrder?.orderVerifierName).toBeNull();
    } finally {
      // Clean up test data and restore baseline
      await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0;');
      await prisma.crmComments.deleteMany();
      await prisma.crmOrders.deleteMany();
      await prisma.crmCustomers.deleteMany();
      await prisma.users.deleteMany({ where: { uid: { not: 1 } } });
      await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1;');
      execSync('npx tsx src/scripts/run-seed.ts');
      execSync('npx tsx src/scripts/restore-admin.ts');
    }
  }, 60000);
});
