import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { authOptions } from '../app/api/auth/[...nextauth]/route';

describe('24-Hour Hard JWT Session Expiration Unit Tests', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should set loginTime on initial user login in jwt callback', async () => {
    const mockUser = {
      id: '10',
      name: 'Test Admin',
      email: 'admin@crm.com',
      nickname: 'AdminNick',
      userPermissions: 'orders:view,orders:create',
      teamId: 1,
    };

    const initialToken = {};
    const resultToken = await authOptions.callbacks!.jwt!({
      token: initialToken as any,
      user: mockUser as any,
      account: null as any,
    });

    expect(resultToken.uid).toBe('10');
    expect(resultToken.nickname).toBe('AdminNick');
    expect(resultToken.userPermissions).toBe('orders:view,orders:create');
    expect(resultToken.teamId).toBe(1);
    expect(resultToken.loginTime).toBeDefined();
    expect(typeof resultToken.loginTime).toBe('number');
  });

  it('should maintain session active when less than 24 hours (e.g. 12 hours) have elapsed', async () => {
    const startTimeSeconds = 1700000000;
    vi.setSystemTime(startTimeSeconds * 1000);

    const activeToken = {
      uid: '10',
      nickname: 'AdminNick',
      userPermissions: 'orders:view',
      teamId: 1,
      loginTime: startTimeSeconds,
    };

    // Advance time by 12 hours (43200 seconds)
    vi.setSystemTime((startTimeSeconds + 12 * 60 * 60) * 1000);

    const resultToken = await authOptions.callbacks!.jwt!({
      token: activeToken as any,
      user: undefined as any,
      account: null as any,
    });

    // Token should remain intact and valid
    expect(resultToken.uid).toBe('10');
    expect(resultToken.nickname).toBe('AdminNick');
    expect(resultToken.loginTime).toBe(startTimeSeconds);
  });

  it('should invalidate token (return empty object) after 24 hours + 1 second have elapsed', async () => {
    const startTimeSeconds = 1700000000;
    vi.setSystemTime(startTimeSeconds * 1000);

    const activeToken = {
      uid: '10',
      nickname: 'AdminNick',
      userPermissions: 'orders:view',
      teamId: 1,
      loginTime: startTimeSeconds,
    };

    // Advance time by 24 hours + 1 second (86401 seconds)
    vi.setSystemTime((startTimeSeconds + 24 * 60 * 60 + 1) * 1000);

    const resultToken = await authOptions.callbacks!.jwt!({
      token: activeToken as any,
      user: undefined as any,
      account: null as any,
    });

    // Token must be emptied to trigger NextAuth hard re-login
    expect(resultToken).toEqual({});
  });

  it('should return unauthenticated session when passed an expired (empty) token', async () => {
    const emptyToken = {};
    const initialSession = {
      user: {
        name: 'Test Admin',
        email: 'admin@crm.com',
      },
      expires: new Date().toISOString(),
    };

    const sessionResult = await authOptions.callbacks!.session!({
      session: initialSession as any,
      token: emptyToken as any,
      user: undefined as any,
      newSession: undefined as any,
      trigger: 'update' as any,
    });

    // Session user id should be undefined, invalidating the active session
    expect((sessionResult.user as any)?.id).toBeUndefined();
  });
});
