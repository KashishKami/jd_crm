import { describe, it, expect, vi, beforeEach } from 'vitest';
import ExcelJS from 'exceljs';
import { getServerSession } from 'next-auth';
import { generateAgentSalesWorkbook } from '../lib/agent-sales-excel-exporter';
import { ReportMatrixResponse } from '../types/report';
import * as reportService from '../service/report.service';

vi.mock('next-auth', () => ({
  default: vi.fn(),
  getServerSession: vi.fn(),
}));

vi.mock('../service/report.service', () => ({
  getAgentSalesMatrix: vi.fn(),
}));

const mockMatrixData: ReportMatrixResponse = {
  periods: [
    { key: '2026-01', label: 'Jan 2026', startDate: '2026-01-01', endDate: '2026-01-31' },
    { key: '2026-02', label: 'Feb 2026', startDate: '2026-02-01', endDate: '2026-02-28' },
  ],
  globalStartDate: '2026-01-01',
  globalEndDate: '2026-02-28',
  rangeLabel: 'Jan - Feb 2026',
  agents: [
    {
      agentId: 101,
      agentName: 'John Doe',
      nickname: 'Johnny',
      teamId: 1,
      teamName: 'IT Park',
      designation: 'Sales Specialist',
      status: 1,
      periods: {
        '2026-01': {
          salesAmount: 15000,
          salesCount: 10,
          refundsAmount: 1000,
          refundsCount: 1,
          chargebacksAmount: 0,
          chargebacksCount: 0,
          netSales: 14000,
          netSalesCount: 9,
        },
        '2026-02': {
          salesAmount: 20000,
          salesCount: 12,
          refundsAmount: 0,
          refundsCount: 0,
          chargebacksAmount: 500,
          chargebacksCount: 1,
          netSales: 19500,
          netSalesCount: 11,
        },
      },
      grandTotal: {
        salesAmount: 35000,
        salesCount: 22,
        refundsAmount: 1000,
        refundsCount: 1,
        chargebacksAmount: 500,
        chargebacksCount: 1,
        netSales: 33500,
        netSalesCount: 20,
      },
    },
  ],
  orgTotal: {
    periods: {
      '2026-01': {
        salesAmount: 15000,
        salesCount: 10,
        refundsAmount: 1000,
        refundsCount: 1,
        chargebacksAmount: 0,
        chargebacksCount: 0,
        netSales: 14000,
        netSalesCount: 9,
      },
      '2026-02': {
        salesAmount: 20000,
        salesCount: 12,
        refundsAmount: 0,
        refundsCount: 0,
        chargebacksAmount: 500,
        chargebacksCount: 1,
        netSales: 19500,
        netSalesCount: 11,
      },
    },
    grandTotal: {
      salesAmount: 35000,
      salesCount: 22,
      refundsAmount: 1000,
      refundsCount: 1,
      chargebacksAmount: 500,
      chargebacksCount: 1,
      netSales: 33500,
      netSalesCount: 20,
    },
  },
};

describe('W-4405: Agent Sales 2-Tier Excel Exporter & Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateAgentSalesWorkbook', () => {
    it('generates a valid 2-tier formatted Excel workbook with formulas, freeze panes and numFmt when metricView="all"', async () => {
      const buffer = await generateAgentSalesWorkbook(mockMatrixData, { metricView: 'all' });
      expect(buffer).toBeDefined();
      expect(buffer.length).toBeGreaterThan(0);

      // Load into ExcelJS to inspect internal properties
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.load(buffer as any);

      const ws = wb.getWorksheet('Agent Sales Report');
      expect(ws).toBeDefined();

      // Check freeze panes: xSplit 5, ySplit 2
      expect(ws!.views).toBeDefined();
      expect(ws!.views[0].state).toBe('frozen');
      expect((ws!.views[0] as any).ySplit).toBe(2);

      // Row 1 Period Headers
      const row1 = ws!.getRow(1);
      expect(row1.getCell(1).value).toBe('AGENT DETAILS');

      // Row 2 Sub-headers
      const row2 = ws!.getRow(2);
      expect(row2.getCell(1).value).toBe('Alias');
      expect(row2.getCell(2).value).toBe('Agent Name');
      expect(row2.getCell(3).value).toBe('Center');
      expect(row2.getCell(4).value).toBe('Designation');
      expect(row2.getCell(5).value).toBe('Status');

      // Check agent data row (Row 3)
      const row3 = ws!.getRow(3);
      expect(row3.getCell(1).value).toBe('Johnny');
      expect(row3.getCell(2).value).toBe('John Doe');
      expect(row3.getCell(3).value).toBe('IT Park');
      // Numeric values (not strings!) - Col 6 is Sales, Col 12 is Net
      const salesGrandTotalCell = row3.getCell(6);
      expect(typeof salesGrandTotalCell.value).toBe('number');
      expect(salesGrandTotalCell.value).toBe(35000);
      expect(salesGrandTotalCell.numFmt).toBe('$#,##0.00');

      const netGrandTotalCell = row3.getCell(12);
      expect(typeof netGrandTotalCell.value).toBe('number');
      expect(netGrandTotalCell.value).toBe(33500);
      expect(netGrandTotalCell.numFmt).toBe('$#,##0.00');

      // Check total summary row (Row 4) has SUM formulas
      const row4 = ws!.getRow(4);
      expect(row4.getCell(1).value).toBe('TOTAL');
      const formulaCell = row4.getCell(6);
      expect(formulaCell.value).toHaveProperty('formula');
      expect((formulaCell.value as any).formula).toBe('SUM(F3:F3)');
    });

    it('generates 2 sub-columns per period when metricView="net"', async () => {
      const buffer = await generateAgentSalesWorkbook(mockMatrixData, { metricView: 'net' });
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.load(buffer as any);
      const ws = wb.getWorksheet('Agent Sales Report');

      // Total columns: 5 (entity) + 2 (grand total) + 2 (Jan) + 2 (Feb) = 11 columns
      expect(ws!.columnCount).toBe(11);
    });

    it('omits Range Grand Total columns when periods.length === 1 to avoid redundancy', async () => {
      const singlePeriodData: ReportMatrixResponse = {
        ...mockMatrixData,
        periods: [
          { key: '2026-10', label: 'Oct 2026', startDate: '2026-10-01', endDate: '2026-10-31' },
        ],
      };
      const buffer = await generateAgentSalesWorkbook(singlePeriodData, { metricView: 'all' });
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.load(buffer as any);
      const ws = wb.getWorksheet('Agent Sales Report');

      // For all metrics with 1 period: 5 (entity) + 8 (Oct 2026) = 13 columns (NO Range Grand Total cols)
      expect(ws!.columnCount).toBe(13);
      const headerRow1 = ws!.getRow(1);
      const cellValues = headerRow1.values as any[];
      const grandTotalFound = cellValues.some((v) => typeof v === 'string' && v.includes('RANGE GRAND TOTAL'));
      expect(grandTotalFound).toBe(false);
    });

    it('applies visual discernment enhancements: widened columns, period header color banding, metric sub-header colors, thick boundary borders, zebra shading, and bold net metrics', async () => {
      const buffer = await generateAgentSalesWorkbook(mockMatrixData, { metricView: 'all' });
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.load(buffer as any);
      const ws = wb.getWorksheet('Agent Sales Report')!;

      // 1. Column widths: currency >= 18, count >= 11
      // Col 6 is Sales ($), Col 7 is Sales (#), Col 12 is Net ($), Col 13 is Net (#)
      expect(ws.getColumn(6).width).toBeGreaterThanOrEqual(18);
      expect(ws.getColumn(7).width).toBeGreaterThanOrEqual(11);
      expect(ws.getColumn(12).width).toBeGreaterThanOrEqual(18);
      expect(ws.getColumn(13).width).toBeGreaterThanOrEqual(11);

      // 2. Row 1: Distinct Period Header Colors
      const row1 = ws.getRow(1);
      // Col 1 (Agent Details) -> fgColor: FF0F172A
      expect((row1.getCell(1).fill as any)?.fgColor?.argb).toBe('FF0F172A');
      // Col 6 (Range Grand Total) -> fgColor: FF065F46
      expect((row1.getCell(6).fill as any)?.fgColor?.argb).toBe('FF065F46');
      // Col 14 (Jan 2026, odd period) -> fgColor: FF1E293B
      expect((row1.getCell(14).fill as any)?.fgColor?.argb).toBe('FF1E293B');
      // Col 22 (Feb 2026, even period) -> fgColor: FF1E3A8A
      expect((row1.getCell(22).fill as any)?.fgColor?.argb).toBe('FF1E3A8A');

      // 3. Row 2: Color-Coded Metric Sub-Headers
      const row2 = ws.getRow(2);
      // Grand Total block:
      // Col 6 ($ Sales) -> 334155
      expect((row2.getCell(6).fill as any)?.fgColor?.argb).toBe('FF334155');
      // Col 8 ($ Ref) -> 881337
      expect((row2.getCell(8).fill as any)?.fgColor?.argb).toBe('FF881337');
      // Col 10 ($ Chb) -> 78350F
      expect((row2.getCell(10).fill as any)?.fgColor?.argb).toBe('FF78350F');
      // Col 12 ($ Net) -> 065F46
      expect((row2.getCell(12).fill as any)?.fgColor?.argb).toBe('FF065F46');

      // 4. Prominent Vertical Boundary Borders (medium border on right edge of blocks)
      // Col 5 (Agent Details end), Col 13 (Grand Total end), Col 21 (Jan end)
      // Check on row 1, row 2, data row 3, and total row 4
      [1, 2, 3, 4].forEach((rowNum) => {
        const row = ws.getRow(rowNum);
        expect(row.getCell(5).border?.right?.style).toBe('medium');
        expect(row.getCell(13).border?.right?.style).toBe('medium');
        expect(row.getCell(21).border?.right?.style).toBe('medium');
      });

      // 5. Data Rows: Net metrics bolded and zebra period shading
      const row3 = ws.getRow(3);
      // Col 12 ($ Net in Grand Total) & Col 13 (# Net in Grand Total)
      expect(row3.getCell(12).font?.bold).toBe(true);
      expect(row3.getCell(13).font?.bold).toBe(true);
      // Col 20 ($ Net in Jan) & Col 21 (# Net in Jan)
      expect(row3.getCell(20).font?.bold).toBe(true);
      expect(row3.getCell(21).font?.bold).toBe(true);

      // Period 2 (Feb 2026, even period) data cells should have zebra fill
      expect((row3.getCell(22).fill as any)?.fgColor?.argb).toBe('FFF8FAFC');
    });
  });

  describe('GET /api/reports/agent-sales/export', () => {
    it('returns 401 if unauthenticated', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce(null);

      const { GET } = await import('../app/api/reports/agent-sales/export/route');
      const req = new Request('http://localhost:3080/api/reports/agent-sales/export');
      const res = await GET(req);

      expect(res.status).toBe(401);
    });

    it('returns 403 Forbidden if user lacks export permissions', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { uid: 99, roleId: 8, userPermissions: ['customers:view'] },
      } as any);

      const { GET } = await import('../app/api/reports/agent-sales/export/route');
      const req = new Request('http://localhost:3080/api/reports/agent-sales/export');
      const res = await GET(req);

      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toBe('Forbidden');
    });

    it('returns 403 Forbidden if user has reports:agent-sales but lacks reports:agent-sales-export', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { uid: 99, roleId: 8, userPermissions: ['reports:agent-sales'] },
      } as any);

      const { GET } = await import('../app/api/reports/agent-sales/export/route');
      const req = new Request('http://localhost:3080/api/reports/agent-sales/export');
      const res = await GET(req);

      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toBe('Forbidden');
    });

    it('returns 200 OK with excel binary buffer when user has reports:agent-sales-export', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { uid: 1, userPermissions: ['reports:agent-sales-export'] },
      } as any);

      vi.mocked(reportService.getAgentSalesMatrix).mockResolvedValueOnce(mockMatrixData);

      const { GET } = await import('../app/api/reports/agent-sales/export/route');
      const req = new Request(
        'http://localhost:3080/api/reports/agent-sales/export?range=monthly&teamId=1&metricView=all'
      );
      const res = await GET(req);

      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toBe(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      expect(res.headers.get('Content-Disposition')).toContain('attachment; filename=');
      const blob = await res.arrayBuffer();
      expect(blob.byteLength).toBeGreaterThan(0);
    });
  });
});
