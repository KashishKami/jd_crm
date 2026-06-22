import { prisma } from '../lib/db';

export async function findByCredential(identifier: string) {
  return prisma.users.findFirst({
    where: {
      OR: [
        { username: identifier },
        { email: identifier },
      ],
    },
  });
}
