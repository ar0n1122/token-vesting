import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    include: ['anchor/tests/**/*.test.ts'],
    hookTimeout: 60000, // 60 second timeout for hooks like beforeAll
  },
})
