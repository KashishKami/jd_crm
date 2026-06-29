export function formatDateDDMMYYYY(dateVal: string | Date | null | undefined): string {
  if (!dateVal) return '—';
  
  // If it's already in YYYY-MM-DD string format, format directly to avoid timezone shift
  if (typeof dateVal === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateVal)) {
    const [y, m, d] = dateVal.split('-');
    return `${d}-${m}-${y}`;
  }
  
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return String(dateVal);
  
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}
