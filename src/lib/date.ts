export function formatDateDDMMYYYY(dateVal: string | Date | null | undefined): string {
  if (!dateVal) return '—';

  // If it's already a bare YYYY-MM-DD string (no time part), reformat directly.
  // This path is hit when the value comes pre-extracted as a date string.
  if (typeof dateVal === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateVal)) {
    const [y, m, d] = dateVal.split('-');
    return `${d}-${m}-${y}`;
  }

  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return String(dateVal);

  // IMPORTANT — use UTC to extract the date, NOT a local/EST timezone.
  //
  // Prisma returns MySQL @db.Date fields as midnight UTC  
  // (e.g. a stored "2025-06-15" comes back as "2025-06-15T00:00:00.000Z").
  // Applying an EST offset (-5h) to midnight UTC shifts the result to the
  // previous calendar day (2025-06-14 19:00 EST), displaying the wrong date.
  //
  // Since @db.Date is timezone-naive, the correct value IS the UTC date.
  const day   = String(d.getUTCDate()).padStart(2, '0');
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const year  = String(d.getUTCFullYear());

  return `${day}-${month}-${year}`;
}

export function formatDateTimeDDMMYYYY(dateVal: string | Date | null | undefined): string {
  if (!dateVal) return '—';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return String(dateVal);
  
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  
  const parts = formatter.formatToParts(d);
  const day = parts.find(p => p.type === 'day')?.value || '00';
  const month = parts.find(p => p.type === 'month')?.value || '00';
  const year = parts.find(p => p.type === 'year')?.value || '0000';
  const hour = parts.find(p => p.type === 'hour')?.value || '00';
  const minute = parts.find(p => p.type === 'minute')?.value || '00';
  
  return `${day}-${month}-${year} ${hour}:${minute}`;
}

export function localDateStringToUtcNoon(dateStr: string): Date {
  // Input YYYY-MM-DD: set to noon UTC to avoid MySQL timezone rollback for @db.Date columns.
  // Midnight UTC (00:00Z) maps to previous-day EST (19:00), so MySQL stores one day early.
  // Noon UTC (12:00Z) is safe across any timezone from UTC-11 to UTC+11.
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
}

/**
 * Reads a @db.Date Prisma field (always returned as midnight UTC by the DB driver)
 * and returns a YYYY-MM-DD string safe for use in <input type="date">.
 * Uses UTC extraction to prevent any local-timezone shift on the client.
 */
export function utcDateToLocalDateString(dateVal: string | Date | null | undefined): string {
  if (!dateVal) return '';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return '';
  // toISOString() is always UTC; split gives YYYY-MM-DD with no TZ shift
  return d.toISOString().split('T')[0];
}

export function convertEstToUtc(dateStr: string, timeStr: string): string {
  // dateStr is YYYY-MM-DD, timeStr is HH:MM (EST/EDT)
  const [y, m, d] = dateStr.split('-').map(Number);
  const [hr, min] = timeStr.split(':').map(Number);
  
  // Interpret input date/time as UTC first
  const utcInterpret = new Date(Date.UTC(y, m - 1, d, hr, min));
  
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  
  const parts = formatter.formatToParts(utcInterpret);
  const findPart = (type: string) => parseInt(parts.find(p => p.type === type)?.value || '0');
  
  // Reconstruct interpreted time in New York
  const nyInterpret = new Date(Date.UTC(
    findPart('year'),
    findPart('month') - 1,
    findPart('day'),
    findPart('hour'),
    findPart('minute')
  ));
  
  // The difference gives the timezone offset in New York
  const offset = utcInterpret.getTime() - nyInterpret.getTime();
  return new Date(utcInterpret.getTime() + offset).toISOString();
}

export function getCurrentEstDateTime(): { date: string; time: string } {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  
  const parts = formatter.formatToParts(now);
  const day = parts.find(p => p.type === 'day')?.value || '00';
  const month = parts.find(p => p.type === 'month')?.value || '00';
  const year = parts.find(p => p.type === 'year')?.value || '0000';
  const hour = parts.find(p => p.type === 'hour')?.value || '00';
  const minute = parts.find(p => p.type === 'minute')?.value || '00';
  
  return {
    date: `${year}-${month}-${day}`,
    time: `${hour}:${minute}`
  };
}
