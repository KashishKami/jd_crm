export function formatDateDDMMYYYY(dateVal: string | Date | null | undefined): string {
  if (!dateVal) return '—';
  
  // If it's already in YYYY-MM-DD string format, format directly to avoid timezone shift
  if (typeof dateVal === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateVal)) {
    const [y, m, d] = dateVal.split('-');
    return `${d}-${m}-${y}`;
  }
  
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return String(dateVal);
  
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  
  const parts = formatter.formatToParts(d);
  const day = parts.find(p => p.type === 'day')?.value || '00';
  const month = parts.find(p => p.type === 'month')?.value || '00';
  const year = parts.find(p => p.type === 'year')?.value || '0000';
  
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

export function convertEstToUtc(dateStr: string, timeStr: string): string {
  // dateStr is YYYY-MM-DD, timeStr is HH:MM
  const utcDate = new Date(`${dateStr}T${timeStr}:00Z`);
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false
  });
  const parts = formatter.formatToParts(utcDate);
  const y = parseInt(parts.find(p => p.type === 'year')?.value || '0');
  const m = parseInt(parts.find(p => p.type === 'month')?.value || '0');
  const d = parseInt(parts.find(p => p.type === 'day')?.value || '0');
  const hr = parseInt(parts.find(p => p.type === 'hour')?.value || '0');
  const min = parseInt(parts.find(p => p.type === 'minute')?.value || '0');

  const formattedUtc = Date.UTC(y, m - 1, d, hr, min, 0);
  const diff = utcDate.getTime() - formattedUtc;
  
  const resultDate = new Date(utcDate.getTime() + diff);
  return resultDate.toISOString();
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
