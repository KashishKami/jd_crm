import { prisma } from '../lib/db';

async function main() {
  console.log('--- RESTORING TEST ADMIN USER ---');

  // Insert or update user with uid 1 to match the integration test expectations
  await prisma.users.upsert({
    where: { uid: 1 },
    update: {
      name: 'Admin',
      nickname: 'JD',
      username: 'admin@gmail.com',
      email: 'admin@gmail.com',
      password: '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9',
      teamId: 1,
      roleId: 1,
    },
    create: {
      uid: 1,
      name: 'Admin',
      nickname: 'JD',
      username: 'admin@gmail.com',
      email: 'admin@gmail.com',
      password: '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9',
      teamId: 1,
      roleId: 1,
    },
  });

  console.log('Test Admin user successfully restored.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
