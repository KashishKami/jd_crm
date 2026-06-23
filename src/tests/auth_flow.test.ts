import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '../lib/db';
import { findByCredential } from '../repository/user.repository';
import { verifyAndMigratePassword } from '../service/auth.service';

describe('Authentication & Password Upgrade Integration Test', () => {
  beforeEach(async () => {
    // Reset seed state to ensure SHA-256 password is present
    await prisma.users.updateMany({
      where: { username: 'admin@gmail.com' },
      data: {
        password: '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', // SHA-256 of admin123
      },
    });
  });

  it('should find user by credential identifier (username or email)', async () => {
    const userByUsername = await findByCredential('admin@gmail.com');
    expect(userByUsername).toBeDefined();
    expect(userByUsername?.username).toBe('admin@gmail.com');

    const userByEmail = await findByCredential('admin@gmail.com');
    expect(userByEmail).toBeDefined();
    expect(userByEmail?.username).toBe('admin@gmail.com');
  });

  it('should authenticate SHA-256 password and upgrade it to bcrypt', async () => {
    const user = await findByCredential('admin@gmail.com');
    expect(user).toBeDefined();
    expect(user?.password).toBe('240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9');

    // Attempt verification and migration
    const isValid = await verifyAndMigratePassword('admin123', user!.password!, user!.uid);
    expect(isValid).toBe(true);

    // Fetch user again and verify password has been upgraded to a bcrypt hash
    const updatedUser = await findByCredential('admin@gmail.com');
    expect(updatedUser?.password).toMatch(/^\$2[ayb]\$/); // Bcrypt prefix regex
  });
});
