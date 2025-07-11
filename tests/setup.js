/**
 * Global test setup configuration
 */

import { vi } from 'vitest';
import { customMatchers } from './helpers/testUtils.js';

// Extend expect with custom matchers
expect.extend(customMatchers);

// Global mocks
global.ResizeObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

global.IntersectionObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock navigator
Object.defineProperty(global, 'navigator', {
  value: {
    clipboard: {
      writeText: vi.fn().mockResolvedValue(undefined),
      readText: vi.fn().mockResolvedValue('')
    },
    userAgent: 'test-user-agent'
  },
  configurable: true
});

// Mock localStorage
Object.defineProperty(global, 'localStorage', {
  value: {
    getItem: vi.fn((key) => {
      return global.localStorage.store[key] || null;
    }),
    setItem: vi.fn((key, value) => {
      global.localStorage.store[key] = value;
    }),
    removeItem: vi.fn((key) => {
      delete global.localStorage.store[key];
    }),
    clear: vi.fn(() => {
      global.localStorage.store = {};
    }),
    store: {}
  },
  configurable: true
});

// Mock sessionStorage
Object.defineProperty(global, 'sessionStorage', {
  value: {
    getItem: vi.fn((key) => {
      return global.sessionStorage.store[key] || null;
    }),
    setItem: vi.fn((key, value) => {
      global.sessionStorage.store[key] = value;
    }),
    removeItem: vi.fn((key) => {
      delete global.sessionStorage.store[key];
    }),
    clear: vi.fn(() => {
      global.sessionStorage.store = {};
    }),
    store: {}
  },
  configurable: true
});

// Mock window.alert, confirm, prompt
global.alert = vi.fn();
global.confirm = vi.fn(() => true);
global.prompt = vi.fn(() => 'test-input');

// Mock File and FileReader for file upload tests
global.File = class File {
  constructor(chunks, filename, options = {}) {
    this.chunks = chunks;
    this.name = filename;
    this.size = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
    this.type = options.type || '';
    this.lastModified = Date.now();
  }
};

global.FileReader = class FileReader {
  constructor() {
    this.readyState = 0;
    this.result = null;
    this.error = null;
    this.onload = null;
    this.onerror = null;
  }

  readAsText(file) {
    setTimeout(() => {
      this.readyState = 2;
      this.result = file.chunks.join('');
      if (this.onload) {
        this.onload({ target: this });
      }
    }, 0);
  }

  readAsDataURL(file) {
    setTimeout(() => {
      this.readyState = 2;
      this.result = `data:${file.type};base64,${btoa(file.chunks.join(''))}`;
      if (this.onload) {
        this.onload({ target: this });
      }
    }, 0);
  }
};

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn((callback) => {
  setTimeout(callback, 16);
});

global.cancelAnimationFrame = vi.fn();

// Mock performance
global.performance = {
  now: vi.fn(() => Date.now()),
  mark: vi.fn(),
  measure: vi.fn(),
  getEntriesByName: vi.fn(() => []),
  getEntriesByType: vi.fn(() => [])
};

// Console warning suppression for tests
const originalWarn = console.warn;
console.warn = vi.fn((message) => {
  // Suppress known Vue warnings in tests
  if (
    message.includes('Vue warn') ||
    message.includes('[Vue warn]') ||
    message.includes('deprecation')
  ) {
    return;
  }
  originalWarn(message);
});

// Setup and teardown hooks
beforeEach(() => {
  // Clear all mocks before each test
  vi.clearAllMocks();
  
  // Reset localStorage
  global.localStorage.clear();
  global.sessionStorage.clear();
  
  // Reset performance timing
  global.performance.now.mockImplementation(() => Date.now());
});

afterEach(() => {
  // Clean up after each test
  vi.clearAllTimers();
  vi.restoreAllMocks();
});

// Global error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Promise Rejection:', reason);
  throw reason;
});

// Test environment checks
if (typeof window !== 'undefined') {
  // Additional browser environment setup
  window.matchMedia = vi.fn((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

// Custom test utilities available globally
global.waitForNextTick = () => new Promise(resolve => setTimeout(resolve, 0));
global.waitForTimeout = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Performance testing utilities
global.measurePerformance = async (fn, label = 'Operation') => {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  const duration = end - start;
  
  console.log(`${label} took ${duration.toFixed(2)}ms`);
  
  return {
    result,
    duration,
    start,
    end
  };
};

// Debug utilities
global.debugTest = (value, label = 'Debug') => {
  console.log(`\n=== ${label} ===`);
  console.log(JSON.stringify(value, null, 2));
  console.log('=================\n');
};

// Test data validation
global.validateTestData = (data, schema) => {
  // Simple validation helper
  for (const [key, validator] of Object.entries(schema)) {
    if (typeof validator === 'function') {
      if (!validator(data[key])) {
        throw new Error(`Test data validation failed for key: ${key}`);
      }
    } else if (typeof validator === 'string') {
      if (typeof data[key] !== validator) {
        throw new Error(`Test data type mismatch for key: ${key}, expected ${validator}, got ${typeof data[key]}`);
      }
    }
  }
};

export default {};