import { defineConfig } from 'vitest/config';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

export default defineConfig({
  test: {
    setupFiles: ['tests/setup.ts'],
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
    hookTimeout: 600000, // 10 minutes
  },
});
