import fs from 'fs';
import path from 'path';
import { prisma } from '../lib/db';

const CSV_FILE_PATH = path.resolve('c:/Users/Administrator/Desktop/JD CRM/Data_for_CRM_v3.csv');

// Robust CSV parser that handles quoted commas, escaped quotes, and newlines inside quotes.
// It only treats quote characters as cell boundaries if they are at field delimiters,
// preventing unescaped literal quotes inside comments from throwing off the parser state.
function parseCSV(content: string): string[][] {
  const result: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i + 1];
    const prevChar = content[i - 1];

    if (char === '"') {
      if (inQuotes) {
        if (nextChar === '"') {
          cell += '"';
          i++;
        } else if (
          nextChar === ',' ||
          nextChar === '\r' ||
          nextChar === '\n' ||
          i === content.length - 1
        ) {
          inQuotes = false;
        } else {
          cell += '"';
        }
      } else {
        if (
          i === 0 ||
          prevChar === ',' ||
          prevChar === '\r' ||
          prevChar === '\n'
        ) {
          inQuotes = true;
        } else {
          cell += '"';
        }
      }
    } else if (char === ',' && !inQuotes) {
      row.push(cell.trim());
      cell = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      row.push(cell.trim());
      if (row.length > 1 || row[0] !== '') {
        result.push(row);
      }
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }

  if (cell !== '' || row.length > 0) {
    row.push(cell.trim());
    result.push(row);
  }
  return result;
}

// Convert standard status strings to the mapped integers used by Next.js CRM
export function mapSaleStatus(status: string): string {
  const lower = status.toLowerCase().trim();
  if (lower === 'sold') return '1';
  if (lower === 'prospect') return '1';
  if (lower === 'call back' || lower === 'callback') return '1';
  if (lower === 'not interested') return '1';
  if (lower === 'out of scope') return '1';
  if (lower === 'enquiry') return '1';
  if (lower === 'refunded') return '2';
  if (lower === 'chargedback' || lower === 'chargebacked') return '3';
  if (lower === 'partial refund' || lower === 'partialrefund' || lower === 'partial refunded' || lower === 'partialrefunded') return '4';
  if (lower === 'void') return '5';
  if (lower === 'no sale' || lower === 'nosale' || lower === 'cancelled') return '6';
  return '1'; // Default fallback is Sold
}

function parseCSVDate(dateStr: string): Date | null {
  if (!dateStr || dateStr === 'NA' || dateStr === '') return null;
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const monthStr = parts[1].toLowerCase().substring(0, 3);
    const year = parseInt(parts[2], 10);
    
    const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const monthIndex = months.indexOf(monthStr);
    
    if (!isNaN(day) && monthIndex !== -1 && !isNaN(year)) {
      const fullYear = year < 100 ? 2000 + year : year;
      return new Date(Date.UTC(fullYear, monthIndex, day));
    }
  }
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    const yr = d.getFullYear();
    const fullYear = yr < 100 ? 2000 + yr : yr;
    return new Date(Date.UTC(fullYear, d.getMonth(), d.getDate()));
  }
  return null;
}

// Parses prices containing mathematical characters like + (e.g. $8250 + $1250) and returns the sum
function parsePriceString(priceStr: string): number {
  if (!priceStr) return 0;
  const matches = priceStr.match(/\d+(\.\d+)?/g);
  if (!matches) return 0;
  return matches.reduce((sum, val) => sum + parseFloat(val), 0);
}

async function main() {
  console.log('--- STARTING CSV DATA IMPORT ---');

  if (!fs.existsSync(CSV_FILE_PATH)) {
    console.error(`Error: CSV file not found at ${CSV_FILE_PATH}`);
    process.exit(1);
  }

  const csvContent = fs.readFileSync(CSV_FILE_PATH, 'utf-8');
  console.log('Parsing CSV content...');
  const rows = parseCSV(csvContent);
  console.log(`Parsed ${rows.length} rows (including header)`);

  if (rows.length < 2) {
    console.log('No data rows to import.');
    return;
  }

  const headers = rows[0];
  const dataRows = rows.slice(1);

  // Cache lookups to speed up database queries
  const agentCache = new Map<string, number>();
  const gatewayCache = new Map<string, number>();
  const vendorCache = new Map<string, number>();

  // Fetch seeded agents to map aliases to uids
  console.log('Fetching seeded agents...');
  const agentsInDb = await prisma.users.findMany({
    select: { uid: true, nickname: true, username: true },
  });
  for (const agent of agentsInDb) {
    if (agent.nickname) {
      agentCache.set(agent.nickname.toLowerCase().trim(), agent.uid);
    }
  }
  console.log(`Loaded ${agentCache.size} agent aliases into memory cache.`);

  // Resolve the fallback admin uid safely (admin user has username = 'admin')
  const adminUser = agentsInDb.find(a => a.username === 'admin');
  const FALLBACK_AGENT_UID: number | null = adminUser?.uid ?? null;
  if (!FALLBACK_AGENT_UID) {
    console.warn('WARNING: Admin user (username=admin) not found. Comments without a matched agent will be skipped.');
  } else {
    console.log(`Fallback comment agent resolved to uid=${FALLBACK_AGENT_UID} (admin).`);
  }

  // Cleanup dynamic tables before importing (to start fresh)
  console.log('Cleaning up existing database records (Comments, Views, Audit logs, Orders, Cards, Customers, Gateways, Vendors)...');
  await prisma.crmComments.deleteMany();
  await prisma.crmOrderViews.deleteMany();
  await prisma.crmOrderAuditLog.deleteMany();
  await prisma.crmOrders.deleteMany();
  await prisma.crmCustomerCards.deleteMany();
  await prisma.crmCustomers.deleteMany();
  await prisma.crmVendors.deleteMany();
  await prisma.crmGateway.deleteMany();
  console.log('Database cleaned successfully.');

  // Reset auto-increment starting counters to 1
  console.log('Resetting database auto-increment counters...');
  await prisma.$executeRawUnsafe('ALTER TABLE crm_customers AUTO_INCREMENT = 1;');
  await prisma.$executeRawUnsafe('ALTER TABLE crm_customer_cards AUTO_INCREMENT = 1;');
  await prisma.$executeRawUnsafe('ALTER TABLE crm_orders AUTO_INCREMENT = 1;');
  await prisma.$executeRawUnsafe('ALTER TABLE crm_vendors AUTO_INCREMENT = 1;');
  await prisma.$executeRawUnsafe('ALTER TABLE crm_gateway AUTO_INCREMENT = 1;');
  await prisma.$executeRawUnsafe('ALTER TABLE crm_comments AUTO_INCREMENT = 1;');

  // 1. Resolve/create Gateways in bulk/unique list
  console.log('Processing unique gateways...');
  const uniqueGateways = Array.from(
    new Set(
      dataRows
        .map((r) => r[23]?.trim())
        .filter((gw) => gw && gw !== 'NA' && gw !== '')
    )
  );
  for (const gwName of uniqueGateways) {
    const gwKey = gwName.toLowerCase();
    const gw = await prisma.crmGateway.create({
      data: {
        gatewayName: gwName,
        gatewayStatus: 1,
        gatewayCreatedAt: new Date(),
        gatewayUpdatedAt: new Date(),
      },
    });
    gatewayCache.set(gwKey, gw.gatewayId);
  }
  console.log(`Created and cached ${gatewayCache.size} unique gateways.`);

  // 2. Resolve/create unique Vendors (Skipped - No vendor information)
  console.log('Skipping vendor processing...');

  // Prepare arrays for batch insertion of main transaction tables
  const customerData: any[] = [];
  const cardData: any[] = [];
  const orderData: any[] = [];
  const commentData: any[] = [];

  let nextCustomerId = 1;
  let failedCount = 0;

  console.log('Parsing data rows...');
  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    if (row.length < 29) {
      failedCount++;
      continue;
    }

    const dateRaw = row[0];
    const customerName = row[1];
    const emailAddress = row[2];
    const phoneNumber = row[3];
    const phoneNumber2 = row[4];
    const billingAddress = row[5];
    const shippingAddress = row[6];
    const nameOnCard = row[7];
    const cardNumber = row[8];
    const expiryDate = row[9];
    const cvvCode = row[10];
    const makeModel = row[11];
    const partDescription = row[12];
    const specifications = row[13];
    const quotedMilesAndWarranty = row[14];
    const vendorMilesAndWarranty = row[15];
    const vinNumber = row[16];
    const pricePitched = row[17];
    const buyingPrice = row[18];
    const computedMarkup = row[19];
    const currentChargedAmount = row[20];
    const shippingType = row[21];
    const supplierVendor = row[22];
    const billingGateway = row[23];
    
    // Clean names to handle 'NA'
    const salesAgentName = row[24];
    const salesVerifierName = row[25];
    const backendExecutiveName = row[26];
    const qaVerifierName = row[27];
    const saleStatusRaw = row[28];
    const remarks = (row[29] && row[29] !== 'NA' && row[29] !== '') ? row[29].trim() : null;

    const cleanAgentName = (salesAgentName && salesAgentName !== 'NA') ? salesAgentName : null;
    const cleanSalesVerifierName = (salesVerifierName && salesVerifierName !== 'NA') ? salesVerifierName : null;
    const cleanBackendExecutiveName = (backendExecutiveName && backendExecutiveName !== 'NA') ? backendExecutiveName : null;
    const cleanQaVerifierName = (qaVerifierName && qaVerifierName !== 'NA') ? qaVerifierName : null;

    const orderDateParsed = parseCSVDate(dateRaw);
    if (!orderDateParsed) {
      failedCount++;
      continue;
    }

    // Resolve Gateway
    let gatewayId: number | null = null;
    if (billingGateway && billingGateway !== 'NA' && billingGateway !== '') {
      gatewayId = gatewayCache.get(billingGateway.toLowerCase().trim()) ?? null;
    }

    // Resolve Vendor
    let vendorId: number | null = null;
    if (supplierVendor && supplierVendor !== 'NA' && supplierVendor !== '') {
      vendorId = vendorCache.get(supplierVendor.toLowerCase().trim()) ?? null;
    }

    // Resolve Agent / Verifiers / Backend / QA
    let agentId: number | null = null;
    if (cleanAgentName) {
      agentId = agentCache.get(cleanAgentName.toLowerCase().trim()) ?? null;
    }
    let salesVerifierId: number | null = null;
    if (cleanSalesVerifierName) {
      salesVerifierId = agentCache.get(cleanSalesVerifierName.toLowerCase().trim()) ?? null;
    }
    let backendExecutiveId: number | null = null;
    if (cleanBackendExecutiveName) {
      backendExecutiveId = agentCache.get(cleanBackendExecutiveName.toLowerCase().trim()) ?? null;
    }
    let qaVerifierId: number | null = null;
    if (cleanQaVerifierName) {
      qaVerifierId = agentCache.get(cleanQaVerifierName.toLowerCase().trim()) ?? null;
    }

    // Pricing & Charged calculations
    const chargedNum = parsePriceString(currentChargedAmount);
    const chargedVal = chargedNum.toFixed(2);

    const customerId = nextCustomerId;
    const customerNameClean = customerName || 'Unknown Customer';

    // 1. Customer
    customerData.push({
      customerId,
      customerName: customerNameClean,
      customerEmail: emailAddress && emailAddress !== 'NA' && emailAddress !== ''
        ? emailAddress
        : `${customerNameClean.replace(/\s+/g, '').toLowerCase()}@example.com`,
      customerPhone: phoneNumber && phoneNumber !== 'NA' ? phoneNumber : null,
      customerBillingAddress: billingAddress && billingAddress !== 'NA' ? billingAddress : null,
      customerShippingAddress: shippingAddress && shippingAddress !== 'NA' ? shippingAddress : null,
      dateCreated: orderDateParsed,
      dateUpdated: new Date(),
    });

    // 2. Customer Card (if present)
    if (cardNumber && cardNumber !== 'NA' && cardNumber !== '') {
      const safeCvv = (cvvCode && cvvCode !== 'NA' && cvvCode !== '') ? cvvCode.substring(0, 5) : null;
      cardData.push({
        cardCustomerId: customerId,
        customerNameOncard: nameOnCard || customerNameClean,
        customerCardNumber: cardNumber,
        customerCardExpDate: expiryDate || 'NA',
        customerCardCvv: safeCvv,
        customerCardCreatedAt: orderDateParsed,
        customerCardUpdated: new Date(),
      });
    }

    const mappedSaleStatus = mapSaleStatus(saleStatusRaw);
    const isReturned = mappedSaleStatus === '2' || mappedSaleStatus === '3' || mappedSaleStatus === '5';
    const isCancelled = mappedSaleStatus === '6';

    // 3. Order
    orderData.push({
      crmOrderId: customerId, // 1-to-1 matching during reset import
      orderCustomerId: customerId,
      orderMakeModel: makeModel || null,
      orderPart: partDescription || null,
      orderPartSize: specifications || null,
      orderQuotedMilesAndWarranty: quotedMilesAndWarranty || null,
      orderVendorMilesAndWarranty: vendorMilesAndWarranty || null,
      orderChecklist: 'No',
      orderVin: vinNumber || null,
      orderTotalPitched: pricePitched || '0',
      orderVendorPrice: buyingPrice || '0',
      orderVendorId: null,
      orderVendorName: null,
      orderShippingType: shippingType || null,
      orderAmountCharged: chargedVal,
      orderRefundAmount: isReturned ? chargedVal : null,
      orderPaymentGatewayId: gatewayId,
      orderSalesAgentId: agentId,
      orderSalesAgentName: cleanAgentName,
      orderSalesVerifierId: salesVerifierId,
      orderSalesVerifierName: cleanSalesVerifierName,
      orderBackendExecutiveId: backendExecutiveId,
      orderBackendExecutiveName: cleanBackendExecutiveName,
      orderVerifierId: qaVerifierId,
      orderVerifierName: cleanQaVerifierName,
      saleStatus: mappedSaleStatus,
      orderCurrentStatus: isReturned ? 'Returned Orders' : isCancelled ? 'Cancelled Orders' : 'Completed Orders',
      orderCurrentStatusUpdateDate: orderDateParsed,
      orderDate: orderDateParsed,
      orderVendorFeedback: 'Positive',
      orderClientFeedback: 'Positive',
      orderResolution: 'Resolved',
      orderCreatedDate: orderDateParsed,
      orderUpdatedDate: new Date(),
    });

    // 4. Remarks Comment
    const commentAgentUid = agentId ?? FALLBACK_AGENT_UID;
    if (remarks && remarks !== 'NA' && remarks !== '' && commentAgentUid !== null) {
      commentData.push({
        customerId,
        orderId: customerId,
        comment: remarks,
        commentAgentId: commentAgentUid,
        commentAgentName: cleanAgentName || 'Admin',
        commentCreatedDate: orderDateParsed,
        commentUpdatedDate: new Date(),
      });
    }

    nextCustomerId++;
  }

  // Bulk execution in database using batch inserts for performance
  console.log(`Prepared bulk records:`);
  console.log(`- Customers: ${customerData.length}`);
  console.log(`- Cards: ${cardData.length}`);
  console.log(`- Orders: ${orderData.length}`);
  console.log(`- Comments: ${commentData.length}`);

  try {
    // Disable constraints during bulk load to speed up
    await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0;');

    // Chunk size to prevent too large query packets
    const chunkSize = 500;

    console.log('Inserting customers...');
    for (let offset = 0; offset < customerData.length; offset += chunkSize) {
      const chunk = customerData.slice(offset, offset + chunkSize);
      await prisma.crmCustomers.createMany({ data: chunk });
    }

    console.log('Inserting customer cards...');
    for (let offset = 0; offset < cardData.length; offset += chunkSize) {
      const chunk = cardData.slice(offset, offset + chunkSize);
      await prisma.crmCustomerCards.createMany({ data: chunk });
    }

    console.log('Inserting orders...');
    for (let offset = 0; offset < orderData.length; offset += chunkSize) {
      const chunk = orderData.slice(offset, offset + chunkSize);
      await prisma.crmOrders.createMany({ data: chunk });
    }

    console.log('Inserting comments...');
    for (let offset = 0; offset < commentData.length; offset += chunkSize) {
      const chunk = commentData.slice(offset, offset + chunkSize);
      await prisma.crmComments.createMany({ data: chunk });
    }

    await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1;');

    console.log('--- CSV IMPORT COMPLETED SUCCESSFULLY ---');
    console.log(`Total Ingested Orders: ${orderData.length}`);
    console.log(`Failed Rows: ${failedCount}`);
  } catch (err) {
    console.error('Fatal error during bulk database writes:', err);
    await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1;');
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error('Fatal error during import:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
