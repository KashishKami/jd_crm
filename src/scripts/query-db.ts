import { prisma } from '../lib/db';

async function main() {
  console.log('Connecting to database...');
  try {
    const data = await prisma.crmCallDispositions.findMany();
    console.log('All call dispositions:', data);
  } catch (err: any) {
    console.error('DATABASE QUERY FAILED:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
