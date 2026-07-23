import { vi, describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import { getServerSession } from 'next-auth';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { prisma } from '../lib/db';
import { GET } from '../app/api/admin/export/route';
import { POST } from '../app/api/admin/backup/trigger/route';

vi.mock('next-auth', () => ({
  default: vi.fn(),
  getServerSession: vi.fn(),
}));

const TEST_BACKUP_DIR = path.join(process.cwd(), 'src/tests/fixtures/test-backups');

describe('Data Management Integration Tests', () => {
  beforeAll(async () => {
    fs.mkdirSync(TEST_BACKUP_DIR, { recursive: true });
    // Set test env variables
    process.env.BACKUP_DIR = TEST_BACKUP_DIR;
    process.env.BACKUP_DB_NAME = 'jd_crm_test';
    process.env.BACKUP_DB_USER = 'root';
    process.env.BACKUP_DB_PASSWORD = 'root_password';
    process.env.BACKUP_CONTAINER_NAME = 'jd_crm_db';

    // Clean up any test records
    await prisma.crmCustomerCards.deleteMany({
      where: { customerNameOncard: 'Test Export Card' }
    });
    await prisma.crmCustomers.deleteMany({
      where: { customerName: 'Test Export Customer' }
    });
    await prisma.users.deleteMany({
      where: { username: 'test_export_agent' }
    });
  });

  afterAll(async () => {
    // Clean up seeded test records
    await prisma.crmCustomerCards.deleteMany({
      where: { customerNameOncard: 'Test Export Card' }
    });
    await prisma.crmCustomers.deleteMany({
      where: { customerName: 'Test Export Customer' }
    });
    await prisma.users.deleteMany({
      where: { username: 'test_export_agent' }
    });

    // Clean up all .sql.gz files in test directory
    if (fs.existsSync(TEST_BACKUP_DIR)) {
      const files = fs.readdirSync(TEST_BACKUP_DIR).filter(f => f.endsWith('.sql.gz'));
      for (const file of files) {
        fs.unlinkSync(path.join(TEST_BACKUP_DIR, file));
      }
      fs.rmdirSync(TEST_BACKUP_DIR);
    }
  });

  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('Excel Export API Route (Phase 27)', () => {
    it('GET /api/admin/export with a session that does NOT have super-admin permission returns HTTP 403 and body { "error": "Forbidden" }', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: {
          id: '1',
          name: 'Normal Rep',
          userPermissions: 'vendors:view',
        },
      });

      const req = new Request('http://localhost/api/admin/export');
      const res = await GET(req);

      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data).toEqual({ error: 'Forbidden' });
    });

    it('GET /api/admin/export with a session that HAS super-admin permission returns HTTP 200, XLSX content type, and proper content disposition', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: {
          id: '1',
          name: 'Super Admin',
          userPermissions: 'super-admin',
        },
      });

      const req = new Request('http://localhost/api/admin/export');
      const res = await GET(req);

      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      expect(res.headers.get('Content-Disposition')).toContain('attachment; filename="jd-crm-export-');
      
      const buffer = await res.arrayBuffer();
      const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' });
      expect(workbook.SheetNames).toContain('Agents');
      expect(workbook.SheetNames).toContain('Orders');
      expect(workbook.SheetNames).toContain('Customers');
    });

    it('GET /api/admin/export includes sensitive agent password fields and customer card CVV/image details', async () => {
      // 1. Seed test agent with password
      await prisma.users.create({
        data: {
          name: 'Test Export Agent',
          username: 'test_export_agent',
          password: 'secretpasswordhash',
          roleId: 1, // Super Admin role
          teamId: 1,
        }
      });

      // 2. Seed test customer and card with CVV and base64 images
      const testCustomer = await prisma.crmCustomers.create({
        data: {
          customerName: 'Test Export Customer',
          customerEmail: 'test_export_customer@example.com',
        }
      });

      await prisma.crmCustomerCards.create({
        data: {
          cardCustomerId: testCustomer.customerId,
          customerNameOncard: 'Test Export Card',
          customerCardNumber: '1111222233334444',
          customerCardExpDate: '12/28',
          customerCardCvv: '123',
          customerCardCopyImage: 'data:image/png;base64,dummyimagecontent1',
          customerPhotoIdImage: 'data:image/png;base64,dummyimagecontent2',
        }
      });

      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: {
          id: '1',
          name: 'Super Admin',
          userPermissions: 'super-admin',
        },
      });

      const req = new Request('http://localhost/api/admin/export');
      const res = await GET(req);
      expect(res.status).toBe(200);

      const buffer = await res.arrayBuffer();
      const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' });

      // Assert password column is present in Agents sheet
      const agentsData: any[] = XLSX.utils.sheet_to_json(workbook.Sheets['Agents']);
      const testAgentRow = agentsData.find(row => row.username === 'test_export_agent');
      expect(testAgentRow).toBeDefined();
      expect(testAgentRow.password).toBe('secretpasswordhash');

      // Assert CVV and copy images are present in Cards sheet
      const cardsData: any[] = XLSX.utils.sheet_to_json(workbook.Sheets['Cards']);
      const testCardRow = cardsData.find(row => row.customerNameOncard === 'Test Export Card');
      expect(testCardRow).toBeDefined();
      expect(testCardRow.customerCardCvv).toBe('123');
      expect(testCardRow.customerCardCopyImage).toBe('data:image/png;base64,dummyimagecontent1');
      expect(testCardRow.customerPhotoIdImage).toBe('data:image/png;base64,dummyimagecontent2');
    });
  });

  describe('Database Backup API Route (Phase 28)', () => {
    it('POST /api/admin/backup/trigger with a session that does NOT have super-admin permission returns HTTP 403 and body { "error": "Forbidden" }', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: {
          id: '1',
          name: 'Normal Rep',
          userPermissions: 'vendors:view',
        },
      });

      const req = new Request('http://localhost/api/admin/backup/trigger', { method: 'POST' });
      const res = await POST(req);

      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data).toEqual({ error: 'Forbidden' });
    });

    it('POST /api/admin/backup/trigger with a session that HAS super-admin permission returns HTTP 200 and saves gzip backup file on disk', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: {
          id: '1',
          name: 'Super Admin',
          userPermissions: 'super-admin',
        },
      });

      const req = new Request('http://localhost/api/admin/backup/trigger', { method: 'POST' });
      const res = await POST(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.filename).toMatch(/^jd_crm_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.sql\.gz$/);

      const filePath = path.join(TEST_BACKUP_DIR, data.filename);
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it('retains only the newest 4 backup files when triggering backups multiple times', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: {
          id: '1',
          name: 'Super Admin',
          userPermissions: 'super-admin',
        },
      });

      // Clear directory first
      const filesBefore = fs.readdirSync(TEST_BACKUP_DIR).filter(f => f.endsWith('.sql.gz'));
      for (const file of filesBefore) {
        fs.unlinkSync(path.join(TEST_BACKUP_DIR, file));
      }

      // Trigger backup 5 times
      for (let i = 0; i < 5; i++) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const req = new Request('http://localhost/api/admin/backup/trigger', { method: 'POST' });
        const res = await POST(req);
        expect(res.status).toBe(200);
      }

      // Check retention count
      const filesAfter = fs.readdirSync(TEST_BACKUP_DIR).filter(f => f.endsWith('.sql.gz'));
      expect(filesAfter.length).toBe(4);
    }, 15000);
  });
});
