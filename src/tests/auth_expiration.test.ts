import { describe, it, expect, vi } from 'vitest';
import { authOptions } from '../app/api/auth/[...nextauth]/route';
import { isAuthorized } from '../middleware';

describe('Phase 38: 24-Hour Auth Expiration & Middleware Guard Tests', () => {
  describe('Middleware Authorized Callback', () => {
    it('should return false when token is an empty object {} (expired 24-hour token)', () => {
      const expiredToken = {};
      const result = isAuthorized({ token: expiredToken as any });
      expect(result).toBe(false);
    });

    it('should return false when token is null or undefined', () => {
      expect(isAuthorized({ token: null as any })).toBe(false);
      expect(isAuthorized({ token: undefined as any })).toBe(false);
    });

    it('should return true when token contains a valid uid', () => {
      const validToken = { uid: '10', name: 'Admin' };
      const result = isAuthorized({ token: validToken as any });
      expect(result).toBe(true);
    });
  });

  describe('NextAuth Session Callback', () => {
    it('should return an empty session (or session without user) when token is empty or lacks uid', async () => {
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

      // Session user must be undefined / absent when token is empty (expired)
      expect((sessionResult as any).user).toBeUndefined();
    });

    it('should populate session user when token has valid uid', async () => {
      const validToken = {
        uid: '10',
        nickname: 'AdminNick',
        userPermissions: 'orders:view',
        teamId: 1,
      };
      const initialSession = {
        user: {
          name: 'Test Admin',
          email: 'admin@crm.com',
        },
        expires: new Date().toISOString(),
      };

      const sessionResult = await authOptions.callbacks!.session!({
        session: initialSession as any,
        token: validToken as any,
        user: undefined as any,
        newSession: undefined as any,
        trigger: 'update' as any,
      });

      const user = (sessionResult as any).user;
      expect(user).toBeDefined();
      expect(user.id).toBe('10');
      expect(user.nickname).toBe('AdminNick');
      expect(user.userPermissions).toBe('orders:view');
      expect(user.teamId).toBe(1);
    });
  });
});
