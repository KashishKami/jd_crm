import ExcelJS from 'exceljs';
import { MetricType, MetricViewType, PeriodMetrics, ReportMatrixResponse } from '../types/report';

function getColumnLetter(colIndex: number): string {
  let temp = colIndex;
  let letter = '';
  while (temp > 0) {
    const mod = (temp - 1) % 26;
    letter = String.fromCharCode(65 + mod) + letter;
    temp = Math.floor((temp - mod) / 26);
  }
  return letter;
}

export async function generateAgentSalesWorkbook(
  matrixData: ReportMatrixResponse,
  options: { metricView?: MetricViewType } = {}
): Promise<Buffer> {
  const metricView = options.metricView || 'all';
  const { periods, agents } = matrixData;

  const wb = new ExcelJS.Workbook();
  wb.creator = 'JD CRM';
  wb.created = new Date();

  const ws = wb.addWorksheet('Agent Sales Report', {
    views: [{ state: 'frozen', xSplit: 5, ySplit: 2 }],
  });

  // Determine sub-column definitions per period block
  type SubColDef = { label: string; key: keyof PeriodMetrics; isCurrency: boolean };
  let subCols: SubColDef[] = [];

  const activeMetrics: MetricType[] =
    metricView === 'all'
      ? ['sales', 'refunds', 'chargebacks', 'net']
      : metricView === 'sales'
      ? ['sales']
      : metricView === 'refunds'
      ? ['refunds']
      : metricView === 'chargebacks'
      ? ['chargebacks']
      : metricView === 'net'
      ? ['net']
      : Array.isArray(metricView) && metricView.length > 0
      ? metricView
      : ['sales', 'refunds', 'chargebacks', 'net'];

  if (activeMetrics.length === 4) {
    subCols = [
      { label: '$ Sales', key: 'salesAmount', isCurrency: true },
      { label: '# Sales', key: 'salesCount', isCurrency: false },
      { label: '$ Ref', key: 'refundsAmount', isCurrency: true },
      { label: '# Ref', key: 'refundsCount', isCurrency: false },
      { label: '$ Chb', key: 'chargebacksAmount', isCurrency: true },
      { label: '# Chb', key: 'chargebacksCount', isCurrency: false },
      { label: '$ Net', key: 'netSales', isCurrency: true },
      { label: '# Net', key: 'netSalesCount', isCurrency: false },
    ];
  } else {
    subCols = [];
    if (activeMetrics.includes('sales')) {
      subCols.push({ label: 'Gross Sales ($)', key: 'salesAmount', isCurrency: true });
      subCols.push({ label: 'Sales (Qty)', key: 'salesCount', isCurrency: false });
    }
    if (activeMetrics.includes('refunds')) {
      subCols.push({ label: 'Refunds ($)', key: 'refundsAmount', isCurrency: true });
      subCols.push({ label: 'Refunds (Qty)', key: 'refundsCount', isCurrency: false });
    }
    if (activeMetrics.includes('chargebacks')) {
      subCols.push({ label: 'Chargebacks ($)', key: 'chargebacksAmount', isCurrency: true });
      subCols.push({ label: 'CB (Qty)', key: 'chargebacksCount', isCurrency: false });
    }
    if (activeMetrics.includes('net')) {
      subCols.push({ label: 'Net Sales ($)', key: 'netSales', isCurrency: true });
      subCols.push({ label: 'Net (Qty)', key: 'netSalesCount', isCurrency: false });
    }
  }

  const subColCount = subCols.length;

  // Set column widths
  const colWidths: number[] = [22, 16, 18, 20, 12]; // Col 1-5: Agent details
  // Grand total block
  for (let i = 0; i < subColCount; i++) {
    colWidths.push(subCols[i].isCurrency ? 15 : 10);
  }
  // Period blocks
  for (let p = 0; p < periods.length; p++) {
    for (let i = 0; i < subColCount; i++) {
      colWidths.push(subCols[i].isCurrency ? 15 : 10);
    }
  }

  colWidths.forEach((w, idx) => {
    ws.getColumn(idx + 1).width = w;
  });

  // Row 1: Top Tier Header
  const row1Values: (string | null)[] = ['AGENT DETAILS', null, null, null, null];
  row1Values.push('RANGE GRAND TOTAL');
  for (let i = 1; i < subColCount; i++) row1Values.push(null);

  periods.forEach((period) => {
    row1Values.push(period.label.toUpperCase());
    for (let i = 1; i < subColCount; i++) row1Values.push(null);
  });

  const headerRow1 = ws.addRow(row1Values);
  headerRow1.height = 28;

  // Merge Row 1 cells
  ws.mergeCells(1, 1, 1, 5); // Agent details
  let currentCol = 6;
  ws.mergeCells(1, currentCol, 1, currentCol + subColCount - 1); // Grand total
  currentCol += subColCount;

  periods.forEach(() => {
    ws.mergeCells(1, currentCol, 1, currentCol + subColCount - 1);
    currentCol += subColCount;
  });

  // Style Row 1
  for (let c = 1; c <= colWidths.length; c++) {
    const cell = headerRow1.getCell(c);
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E293B' }, // Dark Navy
    };
    cell.font = {
      name: 'Calibri',
      size: 11,
      bold: true,
      color: { argb: 'FFFFFFFF' },
    };
    cell.alignment = {
      vertical: 'middle',
      horizontal: 'center',
    };
    cell.border = {
      top: { style: 'medium', color: { argb: 'FF0F172A' } },
      bottom: { style: 'medium', color: { argb: 'FF0F172A' } },
      left: { style: 'thin', color: { argb: 'FF334155' } },
      right: { style: 'thin', color: { argb: 'FF334155' } },
    };
  }

  // Row 2: Sub-headers
  const row2Values: string[] = ['Alias', 'Agent Name', 'Center', 'Designation', 'Status'];
  // Grand total sub-headers
  subCols.forEach((sc) => row2Values.push(sc.label));
  // Period sub-headers
  periods.forEach(() => {
    subCols.forEach((sc) => row2Values.push(sc.label));
  });

  const headerRow2 = ws.addRow(row2Values);
  headerRow2.height = 24;

  for (let c = 1; c <= colWidths.length; c++) {
    const cell = headerRow2.getCell(c);
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF334155' }, // Slate
    };
    cell.font = {
      name: 'Calibri',
      size: 10,
      bold: true,
      color: { argb: 'FFFFFFFF' },
    };
    cell.alignment = {
      vertical: 'middle',
      horizontal: c <= 5 ? (c === 5 ? 'center' : 'left') : 'right',
    };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF1E293B' } },
      bottom: { style: 'medium', color: { argb: 'FF0F172A' } },
      left: { style: 'thin', color: { argb: 'FF475569' } },
      right: { style: 'thin', color: { argb: 'FF475569' } },
    };
  }

  // Data Rows
  agents.forEach((agent) => {
    const rowValues: (string | number)[] = [
      agent.nickname || '',
      agent.agentName,
      agent.teamName || '',
      agent.designation || '',
      agent.status === 1 ? 'Active' : 'Inactive',
    ];

    // Grand total values
    subCols.forEach((sc) => {
      rowValues.push(Number(agent.grandTotal[sc.key]) || 0);
    });

    // Period values
    periods.forEach((period) => {
      const pMetrics = agent.periods[period.key] || {
        salesAmount: 0,
        salesCount: 0,
        refundsAmount: 0,
        refundsCount: 0,
        chargebacksAmount: 0,
        chargebacksCount: 0,
        netSales: 0,
        netSalesCount: 0,
      };
      subCols.forEach((sc) => {
        rowValues.push(Number(pMetrics[sc.key]) || 0);
      });
    });

    const dataRow = ws.addRow(rowValues);
    dataRow.height = 20;

    for (let c = 1; c <= colWidths.length; c++) {
      const cell = dataRow.getCell(c);
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };

      if (c <= 5) {
        cell.alignment = {
          vertical: 'middle',
          horizontal: c === 5 ? 'center' : 'left',
        };
      } else {
        const subColIndex = (c - 6) % subColCount;
        const isCurr = subCols[subColIndex].isCurrency;
        cell.numFmt = isCurr ? '$#,##0.00' : '#,##0';
        cell.alignment = {
          vertical: 'middle',
          horizontal: isCurr ? 'right' : 'center',
        };
      }
    }
  });

  // Bottom Summary Total Row with Live =SUM() Formulas + Pre-calculated Results
  const lastAgentRow = agents.length + 2;
  const startDataRow = 3;
  const totalRowValues: (string | { formula: string; result: number } | null)[] = [
    'TOTAL',
    null,
    null,
    null,
    null,
  ];

  // Grand total formula + values
  subCols.forEach((sc, idx) => {
    const colIndex = 6 + idx;
    const colLetter = getColumnLetter(colIndex);
    const formulaStr =
      agents.length > 0
        ? `SUM(${colLetter}${startDataRow}:${colLetter}${lastAgentRow})`
        : '0';
    const resultVal = Number(matrixData.orgTotal?.grandTotal?.[sc.key]) || 0;
    totalRowValues.push({ formula: formulaStr, result: resultVal });
  });

  // Period formula + values
  periods.forEach((period, pIdx) => {
    const pMetrics = matrixData.orgTotal?.periods?.[period.key];
    subCols.forEach((sc, idx) => {
      const colIndex = 6 + subColCount + (pIdx * subColCount) + idx;
      const colLetter = getColumnLetter(colIndex);
      const formulaStr =
        agents.length > 0
          ? `SUM(${colLetter}${startDataRow}:${colLetter}${lastAgentRow})`
          : '0';
      const resultVal = Number(pMetrics?.[sc.key]) || 0;
      totalRowValues.push({ formula: formulaStr, result: resultVal });
    });
  });

  const totalRow = ws.addRow(totalRowValues);
  totalRow.height = 26;

  // Merge Total Row Cols 1-5
  ws.mergeCells(lastAgentRow + 1, 1, lastAgentRow + 1, 5);

  for (let c = 1; c <= colWidths.length; c++) {
    const cell = totalRow.getCell(c);
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0F172A' }, // Deep Charcoal / Navy
    };
    cell.font = {
      name: 'Calibri',
      size: 11,
      bold: true,
      color: { argb: 'FFFFFFFF' }, // White font for TOTAL label and numbers
    };
    cell.border = {
      top: { style: 'medium', color: { argb: 'FF0F172A' } },
      bottom: { style: 'double', color: { argb: 'FF0F172A' } },
      left: { style: 'thin', color: { argb: 'FF334155' } },
      right: { style: 'thin', color: { argb: 'FF334155' } },
    };

    if (c <= 5) {
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    } else {
      const subColIndex = (c - 6) % subColCount;
      const isCurr = subCols[subColIndex].isCurrency;
      cell.numFmt = isCurr ? '$#,##0.00' : '#,##0';
      cell.alignment = {
        vertical: 'middle',
        horizontal: isCurr ? 'right' : 'center',
      };
    }
  }

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
