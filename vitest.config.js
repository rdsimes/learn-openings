/// <reference types="vitest" />
import { defineConfig } from 'vite'

export default defineConfig({
  test: {
    environment: 'jsdom', // Use jsdom for DOM testing
    globals: true,       // Enable global test functions (describe, it, expect)
    setupFiles: ['./test-setup.js'], // Setup file for test environment
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'test-setup.js',
        '**/*.test.js',
        '**/*.spec.js'
      ]
    }
  }
})
