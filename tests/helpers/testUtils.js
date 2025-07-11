/**
 * Test utilities and helper functions for CobPlanner tests
 */

import { createStore } from 'vuex';
import { mount } from '@vue/test-utils';
import { testStoreConfigs } from '../fixtures/testData.js';

/**
 * Create a test store with specified configuration
 * @param {string} configName - Name of the configuration from testStoreConfigs
 * @param {Object} overrides - Additional state overrides
 * @returns {Object} Vuex store instance
 */
export const createTestStore = (configName = 'basic', overrides = {}) => {
  const config = testStoreConfigs[configName];
  if (!config) {
    throw new Error(`Test store configuration '${configName}' not found`);
  }

  return createStore({
    state() {
      return {
        ...config,
        ...overrides
      };
    },
    mutations: {
      setTheme(state, theme) {
        state.theme = theme;
      },
      setRows(state, rows) {
        state.rows = rows;
      },
      addCannon(state, cannon) {
        state.cannons.push(cannon);
      },
      removeCannon(state, index) {
        state.cannons.splice(index, 1);
      },
      updateCannon(state, { index, cannon }) {
        state.cannons[index] = cannon;
      },
      addWave(state, wave) {
        state.waves.push(wave);
      },
      removeWave(state, index) {
        state.waves.splice(index, 1);
      },
      updateWave(state, { index, wave }) {
        state.waves[index] = wave;
      },
      addOperation(state, { waveIndex, operation }) {
        state.waves[waveIndex].operations.push(operation);
      },
      removeOperation(state, { waveIndex, opIndex }) {
        state.waves[waveIndex].operations.splice(opIndex, 1);
      },
      updateOperation(state, { waveIndex, opIndex, operation }) {
        state.waves[waveIndex].operations[opIndex] = operation;
      }
    },
    getters: {
      totalCannons: (state) => state.cannons.length,
      totalWaves: (state) => state.waves.length,
      totalOperations: (state) => state.waves.reduce((total, wave) => total + wave.operations.length, 0)
    }
  });
};

/**
 * Mount a Vue component with test store
 * @param {Object} component - Vue component to mount
 * @param {Object} options - Mount options
 * @returns {Object} Vue Test Utils wrapper
 */
export const mountWithStore = (component, options = {}) => {
  const store = options.store || createTestStore();
  
  return mount(component, {
    global: {
      plugins: [store],
      ...options.global
    },
    ...options
  });
};

/**
 * Wait for Vue's reactivity to complete
 * @param {Object} wrapper - Vue Test Utils wrapper
 * @param {number} delay - Delay in milliseconds
 */
export const waitForReactivity = async (wrapper, delay = 0) => {
  await wrapper.vm.$nextTick();
  if (delay > 0) {
    await new Promise(resolve => setTimeout(resolve, delay));
  }
};

/**
 * Trigger input change and wait for reactivity
 * @param {Object} wrapper - Vue Test Utils wrapper
 * @param {string} selector - CSS selector for input
 * @param {any} value - Value to set
 */
export const setInputValue = async (wrapper, selector, value) => {
  const input = wrapper.find(selector);
  await input.setValue(value);
  await waitForReactivity(wrapper);
};

/**
 * Trigger select change and wait for reactivity
 * @param {Object} wrapper - Vue Test Utils wrapper
 * @param {string} selector - CSS selector for select
 * @param {any} value - Value to select
 */
export const selectOption = async (wrapper, selector, value) => {
  const select = wrapper.find(selector);
  await select.setValue(value);
  await waitForReactivity(wrapper);
};

/**
 * Click button and wait for reactivity
 * @param {Object} wrapper - Vue Test Utils wrapper
 * @param {string} selector - CSS selector for button
 */
export const clickButton = async (wrapper, selector) => {
  const button = wrapper.find(selector);
  await button.trigger('click');
  await waitForReactivity(wrapper);
};

/**
 * Assert that element contains specific text
 * @param {Object} wrapper - Vue Test Utils wrapper
 * @param {string} selector - CSS selector
 * @param {string} expectedText - Expected text content
 */
export const assertElementContains = (wrapper, selector, expectedText) => {
  const element = wrapper.find(selector);
  expect(element.exists()).toBe(true);
  expect(element.text()).toContain(expectedText);
};

/**
 * Assert that element has specific class
 * @param {Object} wrapper - Vue Test Utils wrapper
 * @param {string} selector - CSS selector
 * @param {string} className - Expected class name
 */
export const assertElementHasClass = (wrapper, selector, className) => {
  const element = wrapper.find(selector);
  expect(element.exists()).toBe(true);
  expect(element.classes()).toContain(className);
};

/**
 * Mock global functions for testing
 */
export const mockGlobals = () => {
  global.alert = vi.fn();
  global.confirm = vi.fn(() => true);
  global.prompt = vi.fn(() => 'test');
  
  // Mock navigator.clipboard
  global.navigator = {
    clipboard: {
      writeText: vi.fn().mockResolvedValue(undefined)
    }
  };
  
  // Mock localStorage
  global.localStorage = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
  };
};

/**
 * Restore global functions after testing
 */
export const restoreGlobals = () => {
  vi.restoreAllMocks();
};

/**
 * Create a mock file for file input testing
 * @param {string} name - File name
 * @param {string} content - File content
 * @param {string} type - MIME type
 * @returns {File} Mock file object
 */
export const createMockFile = (name, content, type = 'application/json') => {
  const file = new File([content], name, { type });
  return file;
};

/**
 * Simulate file input change
 * @param {Object} wrapper - Vue Test Utils wrapper
 * @param {string} selector - CSS selector for file input
 * @param {File} file - Mock file object
 */
export const simulateFileInput = async (wrapper, selector, file) => {
  const input = wrapper.find(selector);
  const event = new Event('change', { bubbles: true });
  Object.defineProperty(event, 'target', {
    value: { files: [file] }
  });
  input.element.dispatchEvent(event);
  await waitForReactivity(wrapper);
};

/**
 * Performance testing utilities
 */
export const performanceUtils = {
  /**
   * Measure execution time of a function
   * @param {Function} fn - Function to measure
   * @returns {Object} Result and timing information
   */
  measure: async (fn) => {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    return {
      result,
      duration: end - start,
      start,
      end
    };
  },

  /**
   * Run multiple iterations and get average timing
   * @param {Function} fn - Function to measure
   * @param {number} iterations - Number of iterations
   * @returns {Object} Average timing and results
   */
  benchmark: async (fn, iterations = 10) => {
    const results = [];
    let totalTime = 0;

    for (let i = 0; i < iterations; i++) {
      const measurement = await performanceUtils.measure(fn);
      results.push(measurement);
      totalTime += measurement.duration;
    }

    return {
      averageTime: totalTime / iterations,
      minTime: Math.min(...results.map(r => r.duration)),
      maxTime: Math.max(...results.map(r => r.duration)),
      totalTime,
      iterations,
      results
    };
  }
};

/**
 * Custom matchers for better assertions
 */
export const customMatchers = {
  /**
   * Check if a value is a valid cannon position
   * @param {Object} cannon - Cannon object to validate
   * @returns {Object} Matcher result
   */
  toBeValidCannon: (cannon) => {
    const isValid = cannon && 
      typeof cannon.row === 'number' && 
      typeof cannon.col === 'number' &&
      cannon.row >= 1 && cannon.row <= 5 &&
      cannon.col >= 1 && cannon.col <= 9;
    
    return {
      pass: isValid,
      message: () => `Expected ${JSON.stringify(cannon)} to be a valid cannon position`
    };
  },

  /**
   * Check if a value is a valid wave configuration
   * @param {Object} wave - Wave object to validate
   * @returns {Object} Matcher result
   */
  toBeValidWave: (wave) => {
    const isValid = wave &&
      typeof wave.duration === 'number' &&
      wave.duration > 0 &&
      Array.isArray(wave.operations);
    
    return {
      pass: isValid,
      message: () => `Expected ${JSON.stringify(wave)} to be a valid wave configuration`
    };
  },

  /**
   * Check if solve result meets expected criteria
   * @param {Object} result - Solve result to validate
   * @param {number} expectedSuccessCount - Expected number of successful operations
   * @returns {Object} Matcher result
   */
  toHaveSuccessCount: (result, expectedSuccessCount) => {
    const actualCount = result.successCount || 0;
    const pass = actualCount === expectedSuccessCount;
    
    return {
      pass,
      message: () => `Expected success count ${expectedSuccessCount}, got ${actualCount}`
    };
  }
};

/**
 * Test data validation utilities
 */
export const validationUtils = {
  /**
   * Validate that all test data is properly structured
   * @param {Object} testData - Test data object to validate
   * @returns {Object} Validation result
   */
  validateTestData: (testData) => {
    const errors = [];
    
    if (testData.cannons) {
      testData.cannons.forEach((cannon, index) => {
        if (!customMatchers.toBeValidCannon(cannon).pass) {
          errors.push(`Invalid cannon at index ${index}: ${JSON.stringify(cannon)}`);
        }
      });
    }
    
    if (testData.waves) {
      testData.waves.forEach((wave, index) => {
        if (!customMatchers.toBeValidWave(wave).pass) {
          errors.push(`Invalid wave at index ${index}: ${JSON.stringify(wave)}`);
        }
      });
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
};

/**
 * Debug utilities for troubleshooting tests
 */
export const debugUtils = {
  /**
   * Log component state for debugging
   * @param {Object} wrapper - Vue Test Utils wrapper
   * @param {string} label - Debug label
   */
  logComponentState: (wrapper, label = 'Component State') => {
    console.log(`\n=== ${label} ===`);
    console.log('Data:', wrapper.vm.$data);
    console.log('Props:', wrapper.vm.$props);
    console.log('Store state:', wrapper.vm.$store?.state);
    console.log('=================\n');
  },

  /**
   * Log test result for debugging
   * @param {any} result - Test result to log
   * @param {string} label - Debug label
   */
  logTestResult: (result, label = 'Test Result') => {
    console.log(`\n=== ${label} ===`);
    console.log(JSON.stringify(result, null, 2));
    console.log('=================\n');
  }
};

export default {
  createTestStore,
  mountWithStore,
  waitForReactivity,
  setInputValue,
  selectOption,
  clickButton,
  assertElementContains,
  assertElementHasClass,
  mockGlobals,
  restoreGlobals,
  createMockFile,
  simulateFileInput,
  performanceUtils,
  customMatchers,
  validationUtils,
  debugUtils
};