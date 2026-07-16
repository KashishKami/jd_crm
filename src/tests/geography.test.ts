import { describe, it, expect } from 'vitest';
import { COUNTRY_STATE_MAP, STATE_TIMEZONE_MAP } from '../lib/geography';

describe('Geography Timezone Map (W-3103)', () => {
  it('should verify that STATE_TIMEZONE_MAP covers all states/provinces in COUNTRY_STATE_MAP', () => {
    const allStatesAndProvinces = [
      ...COUNTRY_STATE_MAP.USA,
      ...COUNTRY_STATE_MAP.Canada
    ];
    
    expect(STATE_TIMEZONE_MAP).toBeDefined();
    
    for (const place of allStatesAndProvinces) {
      const tz = STATE_TIMEZONE_MAP[place];
      expect(tz).toBeDefined();
      expect(typeof tz).toBe('string');
      expect(tz.length).toBeGreaterThan(0);
    }
  });

  it('should verify specific timezone mappings for key regions', () => {
    // Standard timezones
    expect(STATE_TIMEZONE_MAP['California']).toBe('America/Los_Angeles');
    expect(STATE_TIMEZONE_MAP['Ontario']).toBe('America/Toronto');
    expect(STATE_TIMEZONE_MAP['New York']).toBe('America/New_York');
    
    // No-DST / special case regions
    expect(STATE_TIMEZONE_MAP['Arizona']).toBe('America/Phoenix');
    expect(STATE_TIMEZONE_MAP['Saskatchewan']).toBe('America/Regina');
  });
});
