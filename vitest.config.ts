import dotenv from 'dotenv';
dotenv.config({ path: '.env.test' });

import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globalSetup: './src/tests/globalSetup.ts',
    include: ['src/tests/**/*.test.{ts,tsx}'],
    exclude: ['node_modules', '.next', 'dist'],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    pool: 'forks',
    maxWorkers: 1,
    fileParallelism: false,
  },
});
