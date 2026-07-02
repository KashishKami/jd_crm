import { describe, it, expect } from 'vitest';
import { mapSaleStatus } from '../scripts/import-csv-data';

describe('CSV Importer - mapSaleStatus Unit Tests', () => {
  it('should map Void to status code 5', () => {
    expect(mapSaleStatus('Void')).toBe('5');
    expect(mapSaleStatus('void')).toBe('5');
    expect(mapSaleStatus('  Void  ')).toBe('5');
  });

  it('should map No Sale / nosale / cancelled to status code 6', () => {
    expect(mapSaleStatus('No Sale')).toBe('6');
    expect(mapSaleStatus('no sale')).toBe('6');
    expect(mapSaleStatus('nosale')).toBe('6');
    expect(mapSaleStatus('Cancelled')).toBe('6');
    expect(mapSaleStatus('cancelled')).toBe('6');
    expect(mapSaleStatus('  No Sale  ')).toBe('6');
  });

  it('should map standard Sold / Refunded / Chargebacked / Partial Refund correctly', () => {
    expect(mapSaleStatus('Sold')).toBe('1');
    expect(mapSaleStatus('prospect')).toBe('1');
    expect(mapSaleStatus('call back')).toBe('1');
    expect(mapSaleStatus('not interested')).toBe('1');
    expect(mapSaleStatus('out of scope')).toBe('1');
    expect(mapSaleStatus('enquiry')).toBe('1');
    expect(mapSaleStatus('Refunded')).toBe('2');
    expect(mapSaleStatus('Chargedback')).toBe('3');
    expect(mapSaleStatus('Chargebacked')).toBe('3');
    expect(mapSaleStatus('Partial Refund')).toBe('4');
    expect(mapSaleStatus('partialrefund')).toBe('4');
    expect(mapSaleStatus('Partial Refunded')).toBe('4');
    expect(mapSaleStatus('partialrefunded')).toBe('4');
  });

  it('should fall back to default status code 1 for unknown statuses', () => {
    expect(mapSaleStatus('unknown garbage')).toBe('1');
    expect(mapSaleStatus('')).toBe('1');
  });
});
