import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    
    setupFiles: ['tests/setup/env.ts', 'tests/setup/database.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
    hookTimeout: 600000, // 10 minutes
  },
});
