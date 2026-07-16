import dotenv from 'dotenv';
dotenv.config({ path: '.env.test' });

import { execSync } from 'child_process';
import mariadb from 'mariadb';

export async function setup() {
  console.log('--- GLOBAL SETUP STARTING ---');
  
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error('DATABASE_URL is not set in globalSetup environment variables.');
  }
  
  const url = new URL(dbUrl);
  const host = url.hostname || '127.0.0.1';
  const port = url.port ? parseInt(url.port) : 3306;
  const user = decodeURIComponent(url.username);
  const password = decodeURIComponent(url.password);
  const database = decodeURIComponent(url.pathname.replace(/^\//, ''));
  
  console.log(`Ensuring test database "${database}" exists on ${host}:${port}...`);
  const conn = await mariadb.createConnection({
    host,
    port,
    user,
    password,
    allowPublicKeyRetrieval: true,
  });
  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${database}\``);
  await conn.end();
  
  console.log('Synchronizing Prisma schema with test database...');
  execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
  
  console.log('Seeding baseline data to test database...');
  execSync('npx tsx src/scripts/run-seed.ts', { stdio: 'inherit' });
  
  console.log('Restoring test admin user...');
  execSync('npx tsx src/scripts/restore-admin.ts', { stdio: 'inherit' });
  
  console.log('--- GLOBAL SETUP COMPLETED ---');
}

export async function teardown() {
  console.log('--- GLOBAL TEARDOWN CLEANUP STARTING ---');
  
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    return;
  }
  
  const url = new URL(dbUrl);
  const host = url.hostname || '127.0.0.1';
  const port = url.port ? parseInt(url.port) : 3306;
  const user = decodeURIComponent(url.username);
  const password = decodeURIComponent(url.password);
  const database = decodeURIComponent(url.pathname.replace(/^\//, ''));
  
  console.log(`Connecting to clean up test database "${database}"...`);
  const conn = await mariadb.createConnection({
    host,
    port,
    user,
    password,
    database,
    allowPublicKeyRetrieval: true,
  });
  
  await conn.query('SET FOREIGN_KEY_CHECKS = 0');
  
  const tables = [
    'crm_follow_ups',
    'crm_comments',
    'crm_sale_status_history',
    'crm_order_current_status_history',
    'crm_order_views',
    'crm_orders',
    'crm_customer_cards',
    'crm_customers',
    'crm_vendors',
    'crm_gateway',
    'crm_attendance',
    'usercheck',
    'users_profile_academic',
    'users_profile_professional',
    'users_profile',
    'users',
    'crm_teams',
    'crm_role_permissions',
    'crm_roles',
    'crm_permissions'
  ];
  
  for (const table of tables) {
    try {
      console.log(`Cleaning table: ${table}`);
      await conn.query(`TRUNCATE TABLE \`${table}\``);
    } catch (e) {
      try {
        await conn.query(`DELETE FROM \`${table}\``);
      } catch (err) {
        console.error(`Failed to clean table ${table}:`, err);
      }
    }
  }
  
  await conn.query('SET FOREIGN_KEY_CHECKS = 1');
  await conn.end();
  
  console.log('--- GLOBAL TEARDOWN CLEANUP COMPLETED ---');
}
