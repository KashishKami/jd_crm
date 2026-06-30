import fs from 'fs';
import path from 'path';
import { prisma } from '../lib/db';

const CSV_FILE_PATH = path.resolve('c:/Users/Administrator/Desktop/JD CRM/Data for CRM - CRM_Import_Ready.csv');

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
function mapSaleStatus(status: string): string {
  const lower = status.toLowerCase().trim();
  if (lower === 'sold') return '1';
  if (lower === 'prospect') return '2';
  if (lower === 'call back' || lower === 'callback') return '3';
  if (lower === 'not interested') return '4';
  if (lower === 'out of scope') return '5';
  if (lower === 'enquiry') return '6';
  if (lower === 'refunded') return '7';
  if (lower === 'chargedback' || lower === 'chargebacked') return '8';
  return '1'; // Default fallback is Sold
}

function parseCSVDate(dateStr: string): Date | null {
  if (!dateStr || dateStr === 'NA' || dateStr === '') return null;
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // 0-indexed month
    const year = parseInt(parts[2], 10);
    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      return new Date(year, month, day);
    }
  }
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
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
  console.log('Cleaning up existing database records (Orders, Cards, Customers, Gateways, Vendors)...');
  await prisma.crmComments.deleteMany();
  await prisma.crmOrders.deleteMany();
  await prisma.crmCustomerCards.deleteMany();
  await prisma.crmCustomers.deleteMany();
  await prisma.crmVendors.deleteMany();
  await prisma.crmGateway.deleteMany();
  console.log('Database cleaned successfully.');

  // Allow resuming mid-import: set RESUME_FROM_ROW=N env var to skip already-imported rows
  const resumeFrom = parseInt(process.env.RESUME_FROM_ROW || '0', 10);
  if (resumeFrom > 0) {
    console.log(`Resuming from row ${resumeFrom + 2} (skipping first ${resumeFrom} data rows).`);
  }

  let importedCount = 0;
  let failedCount = 0;

  for (let i = resumeFrom; i < dataRows.length; i++) {
    const row = dataRows[i];
    // Check if row has enough cells
    if (row.length < 25) {
      console.warn(`Skipping malformed row ${i + 2}: insufficient columns (${row.length})`);
      failedCount++;
      continue;
    }

    try {
      // Map columns based on indexes
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
      const vinNumber = row[14];
      const quotedMiles = row[15];
      const vendorMiles = row[16];
      const pricePitched = row[17];
      const buyingPrice = row[18];
      const shippingType = row[19];
      const supplierVendor = row[20];
      const billingGateway = row[21];
      const salesAgentName = row[22];
      const qaVerifierName = row[23];
      const saleStatusRaw = row[24];
      const remarks = row[25];

      // 1. Resolve Gateway or create on-the-fly
      let gatewayId: number | null = null;
      if (billingGateway && billingGateway !== 'NA' && billingGateway !== '') {
        const gwKey = billingGateway.toLowerCase().trim();
        if (gatewayCache.has(gwKey)) {
          gatewayId = gatewayCache.get(gwKey)!;
        } else {
          const gw = await prisma.crmGateway.create({
            data: {
              gatewayName: billingGateway,
              gatewayStatus: 1,
              gatewayCreatedAt: new Date(),
              gatewayUpdatedAt: new Date(),
            },
          });
          gatewayCache.set(gwKey, gw.gatewayId);
          gatewayId = gw.gatewayId;
        }
      }

      // 2. Resolve Supplier / Vendor or create on-the-fly
      let vendorId: number | null = null;
      if (supplierVendor && supplierVendor !== 'NA' && supplierVendor !== '') {
        const vendorKey = supplierVendor.toLowerCase().trim();
        if (vendorCache.has(vendorKey)) {
          vendorId = vendorCache.get(vendorKey)!;
        } else {
          // Parse name / contact person out of supplier (e.g. "Ace AA / Jay" -> Name: Ace AA, Contact: Jay)
          const parts = supplierVendor.split('/');
          const vName = parts[0].trim();
          const vContact = parts[1]?.trim() || 'Unknown';
          const newVendor = await prisma.crmVendors.create({
            data: {
              vendorName: vName,
              vendorContactPerson: vContact,
              vendorPhone: '000-000-0000',
              vendorStatus: 1,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          });
          vendorCache.set(vendorKey, newVendor.vendorId);
          vendorId = newVendor.vendorId;
        }
      }

      // 3. Resolve Sales Agent and QA Verifier
      let agentId: number | null = null;
      if (salesAgentName) {
        const agentKey = salesAgentName.toLowerCase().trim();
        if (agentCache.has(agentKey)) {
          agentId = agentCache.get(agentKey)!;
        }
      }
      let verifierId: number | null = null;
      if (qaVerifierName) {
        const verifierKey = qaVerifierName.toLowerCase().trim();
        if (agentCache.has(verifierKey)) {
          verifierId = agentCache.get(verifierKey)!;
        }
      }

      // Calculate markup
      const pitchedNum = parsePriceString(pricePitched);
      const buyingNum = parsePriceString(buyingPrice);
      const markupVal = (pitchedNum - buyingNum).toFixed(2);

      // Extract Year and Make/Model
      let year = '';
      let makeAndModel = makeModel;
      const yearMatch = makeModel.match(/^(\d{4})\b/);
      if (yearMatch) {
        year = yearMatch[1];
        makeAndModel = makeModel.replace(/^(\d{4})\s*/, '');
      }

      const orderDateParsed = parseCSVDate(dateRaw);
      if (!orderDateParsed) {
        console.warn(`Skipping row ${i + 2}: Order date is missing/empty for customer "${customerName || 'Unknown'}"`);
        failedCount++;
        continue;
      }

      // ---------------------------------------------------------------
      // Create records WITHOUT $transaction() — each operation uses its
      // own pooled connection so GoDaddy's wait_timeout cannot kill a
      // long-held transaction connection mid-row (ECONNRESET fix).
      // ---------------------------------------------------------------

      // Step 1: Create Customer
      const customerNameClean = customerName || 'Unknown Customer';
      const customer = await prisma.crmCustomers.create({
        data: {
          firstName: customerNameClean,
          lastName: customerNameClean,
          customerEmail: emailAddress && emailAddress !== 'NA' && emailAddress !== ''
            ? emailAddress
            : `${customerNameClean.replace(/\s+/g, '').toLowerCase()}@example.com`,
          customerPhone: phoneNumber && phoneNumber !== 'NA' ? phoneNumber : null,
          customerBillingAddress: billingAddress && billingAddress !== 'NA' ? billingAddress : null,
          customerShippingAddress: shippingAddress && shippingAddress !== 'NA' ? shippingAddress : null,
          dateCreated: orderDateParsed,
          dateUpdated: new Date(),
        },
      });

      // Step 2: Create Card details if present
      if (cardNumber && cardNumber !== 'NA' && cardNumber !== '') {
        // Truncate CVV to VARCHAR(5) max — guard against malformed CSV data
        const safeCvv = (cvvCode && cvvCode !== 'NA' && cvvCode !== '') ? cvvCode.substring(0, 5) : null;
        await prisma.crmCustomerCards.create({
          data: {
            cardCustomerId: customer.customerId,
            customerNameOncard: nameOnCard || customerNameClean,
            customerCardNumber: cardNumber,
            customerCardExpDate: expiryDate || 'NA',
            customerCardCvv: safeCvv,
            customerCardCreatedAt: orderDateParsed,
            customerCardUpdated: new Date(),
          },
        });
      }

      // Step 3: Create Order
      const order = await prisma.crmOrders.create({
        data: {
          orderCustomerId: customer.customerId,
          orderMakeModel: makeModel || null,
          orderPart: partDescription || null,
          orderPartSize: specifications || null,
          orderQuotedMiles: quotedMiles || null,
          orderGivenMiles: vendorMiles || null,
          orderVin: vinNumber || null,
          orderTotalPitched: pricePitched || '0',
          orderVendorPrice: buyingPrice || '0',
          orderVendorId: vendorId,
          orderVendorName: supplierVendor || null,
          orderShippingType: shippingType || null,
          orderMarkup: markupVal,
          orderPaymentGatewayId: gatewayId,
          orderSalesAgentId: agentId,
          orderSalesAgentName: salesAgentName || null,
          orderVerifierId: verifierId,
          orderVerifierName: qaVerifierName || null,
          saleStatus: mapSaleStatus(saleStatusRaw),
          orderCurrentStatus: 'Completed Orders',
          orderCurrentStatusUpdateDate: orderDateParsed,
          orderDate: orderDateParsed,
          orderVendorFeedback: 'Positive',
          orderClientFeedback: 'Positive',
          orderResolution: 'Resolved',
          orderCreatedDate: orderDateParsed,
          orderUpdatedDate: new Date(),
        },
      });

      // Step 4: Add Remarks as a Comment
      // Only create comment if we have a valid agent FK — commentAgentId is NOT NULL
      const commentAgentUid = agentId ?? FALLBACK_AGENT_UID;
      if (remarks && remarks !== 'NA' && remarks !== '' && commentAgentUid !== null) {
        await prisma.crmComments.create({
          data: {
            customerId: customer.customerId,
            orderId: order.crmOrderId,
            comment: remarks,
            commentAgentId: commentAgentUid,
            commentAgentName: salesAgentName || 'Admin',
            commentCreatedDate: orderDateParsed,
            commentUpdatedDate: new Date(),
          },
        });
      }

      importedCount++;
      if (importedCount % 50 === 0) {
        console.log(`Imported ${importedCount} records... (CSV row ${i + 2})`);
      }
    } catch (err) {
      console.error(`Failed to import row ${i + 2}:`, err);
      failedCount++;
    }
  }

  console.log('--- IMPORT COMPLETED ---');
  console.log(`Successfully imported: ${importedCount} orders`);
  console.log(`Failed rows: ${failedCount}`);
}

main()
  .catch((e) => {
    console.error('Fatal error during import:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
