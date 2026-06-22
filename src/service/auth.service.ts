import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { prisma } from '../lib/db';

function sha256(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

export async function verifyAndMigratePassword(
  passwordRaw: string,
  passwordHashDb: string,
  userId: number
): Promise<boolean> {
  // 1. Check if the stored hash is a legacy SHA-256 hash
  // SHA-256 hashes are hex strings of exactly 64 characters
  const isLegacySha256 = /^[0-9a-f]{64}$/i.test(passwordHashDb);

  if (isLegacySha256) {
    const computedSha256 = sha256(passwordRaw);
    if (computedSha256 === passwordHashDb) {
      // Authenticated via legacy hash! Upgrading to bcrypt on-the-fly.
      const bcryptHash = await bcrypt.hash(passwordRaw, 10);
      await prisma.users.update({
        where: { uid: userId },
        data: { password: bcryptHash },
      });
      return true;
    }
    return false;
  }

  // 2. Otherwise, check using bcrypt
  try {
    return await bcrypt.compare(passwordRaw, passwordHashDb);
  } catch (error) {
    console.error('Password comparison failed:', error);
    return false;
  }
}
