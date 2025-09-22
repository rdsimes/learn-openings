// Test setup file for Vitest
import { vi } from 'vitest'

// Mock global objects that might be needed
global.console = {
  ...console,
  // Keep console.log for debugging but suppress in tests if needed
  log: vi.fn(console.log),
  error: vi.fn(console.error),
  warn: vi.fn(console.warn),
  info: vi.fn(console.info)
}

// Mock any other globals your application might need
global.window = global.window || {}
global.document = global.document || {}

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks()
})
