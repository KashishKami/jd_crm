// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getSafeUrlParam } from '../lib/urlStateHelper';

describe('W-3401: getSafeUrlParam Helper', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return defaultValue when window.location is on a different route (/orders) but expectedBasePath is /follow-ups', () => {
    delete (window as any).location;
    window.location = {
      ...originalLocation,
      pathname: '/orders',
      search: '?agentId=5&status=Sold',
    } as any;

    const result = getSafeUrlParam({
      paramName: 'agentId',
      expectedBasePath: '/follow-ups',
      defaultValue: '',
    });

    expect(result).toBe('');
    window.location = originalLocation as any;
  });

  it('should return parameter value from coming_from_detail when returning from detail page to /follow-ups', () => {
    delete (window as any).location;
    window.location = {
      ...originalLocation,
      pathname: '/follow-ups/123',
      search: '',
    } as any;

    sessionStorage.setItem('coming_from_detail', '/follow-ups?page=2&status=Interested');

    const statusVal = getSafeUrlParam({
      paramName: 'status',
      expectedBasePath: '/follow-ups',
      defaultValue: '',
    });

    const pageVal = getSafeUrlParam({
      paramName: 'page',
      expectedBasePath: '/follow-ups',
      defaultValue: '1',
    });

    expect(statusVal).toBe('Interested');
    expect(pageVal).toBe('2');

    window.location = originalLocation as any;
  });

  it('should prioritize useSearchParams when provided', () => {
    const mockSearchParams = {
      get: (key: string) => (key === 'priority' ? 'High' : null),
    };

    const result = getSafeUrlParam({
      searchParams: mockSearchParams,
      paramName: 'priority',
      expectedBasePath: '/follow-ups',
      defaultValue: '',
    });

    expect(result).toBe('High');
  });

  it('should return parameter from window.location.search if pathname starts with expectedBasePath', () => {
    delete (window as any).location;
    window.location = {
      ...originalLocation,
      pathname: '/agents',
      search: '?role=Admin',
    } as any;

    const result = getSafeUrlParam({
      paramName: 'role',
      expectedBasePath: '/agents',
      defaultValue: 'all',
    });

    expect(result).toBe('Admin');
    window.location = originalLocation as any;
  });
});
