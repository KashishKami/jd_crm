import fs from 'fs';
import path from 'path';

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

function main() {
  const csvPath = path.resolve(process.cwd(), 'Data for CRM - CRM_Import_Ready.csv');
  const content = fs.readFileSync(csvPath, 'utf-8');
  const rows = parseCSV(content);
  
  console.log(`Parsed total rows: ${rows.length}`);
  console.log('Headers:', rows[0].length, rows[0]);
  
  let emptyDateCount = 0;
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (r[0] === '' || r[0] === 'NA') {
      emptyDateCount++;
      console.log(`Row ${i + 1} has empty date. Customer: ${r[1]}, Total Columns: ${r.length}`);
    }
  }
  console.log(`Total rows with empty date: ${emptyDateCount}`);
}

main();
