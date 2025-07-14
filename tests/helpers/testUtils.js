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
    modules: {
      ui: {
        namespaced: true,
        state: () => ({
          theme: config.theme || 'light',
          ...overrides.ui
        }),
        getters: {
          theme: (state) => state.theme,
          isDarkTheme: (state) => state.theme === 'dark'
        },
        mutations: {
          SET_THEME(state, theme) {
            state.theme = theme;
          },
          TOGGLE_THEME(state) {
            state.theme = state.theme === 'light' ? 'dark' : 'light';
          }
        },
        actions: {
          setTheme({ commit }, theme) {
            commit('SET_THEME', theme);
          },
          toggleTheme({ commit }) {
            commit('TOGGLE_THEME');
          }
        }
      },
      field: {
        namespaced: true,
        state: () => ({
          fieldName: config.fieldName || '',
          rows: config.rows || 5,
          cannons: config.cannons || [],
          ...overrides.field
        }),
        getters: {
          fieldName: (state) => state.fieldName,
          rows: (state) => state.rows,
          cannons: (state) => state.cannons,
          cannonCount: (state) => state.cannons.length,
          hasCannons: (state) => state.cannons.length > 0,
          getCannonAt: (state) => (row, col) => {
            return state.cannons.find(c => c.row === row && c.col === col);
          },
          hasCannonAt: (state) => (row, col) => {
            return state.cannons.some(c => 
              c.row === row && (c.col === col || c.col === col - 1)
            );
          }
        },
        mutations: {
          SET_FIELD_NAME(state, fieldName) {
            state.fieldName = fieldName;
          },
          SET_ROWS(state, rows) {
            state.rows = rows;
          },
          SET_CANNONS(state, cannons) {
            state.cannons = cannons;
          },
          ADD_CANNON(state, { row, col }) {
            const exists = state.cannons.some(c => c.row === row && c.col === col);
            if (!exists) {
              state.cannons.push({ row, col });
            }
          },
          REMOVE_CANNON(state, { row, col }) {
            state.cannons = state.cannons.filter(c => !(c.row === row && c.col === col));
          }
        },
        actions: {
          setFieldName({ commit }, fieldName) {
            commit('SET_FIELD_NAME', fieldName);
          },
          setRows({ commit }, rows) {
            commit('SET_ROWS', rows);
          },
          setCannons({ commit }, cannons) {
            commit('SET_CANNONS', cannons);
          },
          addCannon({ commit }, cannon) {
            commit('ADD_CANNON', cannon);
          },
          removeCannon({ commit }, cannon) {
            commit('REMOVE_CANNON', cannon);
          }
        }
      },
      waves: {
        namespaced: true,
        state: () => ({
          waves: config.waves || [],
          ...overrides.waves
        }),
        getters: {
          waves: (state) => state.waves,
          waveCount: (state) => state.waves.length,
          hasWaves: (state) => state.waves.length > 0,
          totalOperations: (state) => {
            return state.waves.reduce((total, wave) => {
              return total + wave.operations.filter(op => op.type === 'fire').length;
            }, 0);
          }
        },
        mutations: {
          SET_WAVES(state, waves) {
            state.waves = waves;
          },
          ADD_WAVE(state) {
            state.waves.push({
              duration: 601,
              notes: '',
              operations: []
            });
          },
          REMOVE_WAVE(state, index) {
            state.waves.splice(index, 1);
          },
          UPDATE_WAVE(state, { index, wave }) {
            if (state.waves[index]) {
              state.waves[index] = { ...wave };
            }
          },
          ADD_OPERATION(state, { waveIndex, operation }) {
            if (state.waves[waveIndex]) {
              state.waves[waveIndex].operations.push(operation);
            }
          },
          REMOVE_OPERATION(state, { waveIndex, opIndex }) {
            if (state.waves[waveIndex] && state.waves[waveIndex].operations[opIndex]) {
              state.waves[waveIndex].operations.splice(opIndex, 1);
            }
          },
          UPDATE_OPERATION(state, { waveIndex, opIndex, operation }) {
            if (state.waves[waveIndex] && state.waves[waveIndex].operations[opIndex]) {
              state.waves[waveIndex].operations[opIndex] = { ...operation };
            }
          }
        },
        actions: {
          setWaves({ commit }, waves) {
            commit('SET_WAVES', waves);
          },
          addWave({ commit }) {
            commit('ADD_WAVE');
          },
          removeWave({ commit }, index) {
            commit('REMOVE_WAVE', index);
          },
          updateWave({ commit }, payload) {
            commit('UPDATE_WAVE', payload);
          },
          addOperation({ commit }, payload) {
            commit('ADD_OPERATION', payload);
          },
          removeOperation({ commit }, payload) {
            commit('REMOVE_OPERATION', payload);
          },
          updateOperation({ commit }, payload) {
            commit('UPDATE_OPERATION', payload);
          }
        }
      },
      clipboard: {
        namespaced: true,
        state: () => ({
          clipboard: {
            type: null,
            data: null,
            sourceInfo: null,
            timestamp: null
          },
          copiedItemId: null,
          showPasteZones: false
        }),
        getters: {
          hasClipboardData: (state) => state.clipboard.type !== null && state.clipboard.data !== null,
          clipboardContent: (state) => state.clipboard,
          hasOperationInClipboard: (state) => state.clipboard.type === 'operation',
          hasWaveInClipboard: (state) => state.clipboard.type === 'wave',
          isItemCopied: (state) => (itemId) => state.copiedItemId === itemId,
          shouldShowPasteZones: (state) => state.showPasteZones,
          clipboardAge: (state) => {
            if (!state.clipboard.timestamp) return null;
            return Math.floor((Date.now() - state.clipboard.timestamp) / 1000);
          }
        },
        mutations: {
          SET_CLIPBOARD(state, { type, data, sourceInfo = null }) {
            state.clipboard = {
              type,
              data: JSON.parse(JSON.stringify(data)),
              sourceInfo,
              timestamp: Date.now()
            };
            state.copiedItemId = `${type}-${Date.now()}`;
          },
          CLEAR_CLIPBOARD(state) {
            state.clipboard = { type: null, data: null, sourceInfo: null, timestamp: null };
            state.copiedItemId = null;
          },
          SET_COPIED_ITEM_ID(state, itemId) {
            state.copiedItemId = itemId;
          },
          SET_SHOW_PASTE_ZONES(state, show) {
            state.showPasteZones = show;
          }
        },
        actions: {
          copyOperation({ commit }, { operation, waveIndex, opIndex }) {
            commit('SET_CLIPBOARD', { type: 'operation', data: operation, sourceInfo: { waveIndex, opIndex } });
          },
          copyWave({ commit }, { wave, waveIndex }) {
            commit('SET_CLIPBOARD', { type: 'wave', data: wave, sourceInfo: { waveIndex } });
          },
          clearClipboard({ commit }) {
            commit('CLEAR_CLIPBOARD');
          },
          getClipboardForPaste({ getters }) {
            if (!getters.hasClipboardData) return null;
            return {
              type: getters.clipboardContent.type,
              data: JSON.parse(JSON.stringify(getters.clipboardContent.data)),
              sourceInfo: getters.clipboardContent.sourceInfo
            };
          },
          showPasteZones({ commit }) {
            commit('SET_SHOW_PASTE_ZONES', true);
          },
          hidePasteZones({ commit }) {
            commit('SET_SHOW_PASTE_ZONES', false);
          },
          cleanupOldClipboard() {
            // Mock implementation for tests
          }
        }
      },
      selection: {
        namespaced: true,
        state: () => ({
          selection: {
            type: null,
            waveIndex: null,
            opIndex: null
          }
        }),
        getters: {
          currentSelection: (state) => state.selection,
          hasSelection: (state) => state.selection.type !== null,
          isOperationSelected: (state) => (waveIndex, opIndex) => {
            return state.selection.type === 'operation' &&
                   state.selection.waveIndex === waveIndex &&
                   state.selection.opIndex === opIndex;
          },
          isWaveSelected: (state) => (waveIndex) => {
            return state.selection.type === 'wave' &&
                   state.selection.waveIndex === waveIndex;
          },
          selectedOperation: (state, getters, rootState, rootGetters) => {
            if (state.selection.type !== 'operation') return null;
            const waves = rootGetters['waves/waves'];
            const wave = waves[state.selection.waveIndex];
            if (!wave) return null;
            return wave.operations[state.selection.opIndex] || null;
          },
          selectedWave: (state, getters, rootState, rootGetters) => {
            if (state.selection.type !== 'wave') return null;
            const waves = rootGetters['waves/waves'];
            return waves[state.selection.waveIndex] || null;
          },
          selectionInfo: (state, getters) => {
            if (!getters.hasSelection) return null;
            return {
              type: state.selection.type,
              waveIndex: state.selection.waveIndex,
              opIndex: state.selection.opIndex,
              item: state.selection.type === 'operation' ? getters.selectedOperation : getters.selectedWave
            };
          }
        },
        mutations: {
          SELECT_OPERATION(state, { waveIndex, opIndex }) {
            state.selection = { type: 'operation', waveIndex, opIndex };
          },
          SELECT_WAVE(state, { waveIndex }) {
            state.selection = { type: 'wave', waveIndex, opIndex: null };
          },
          CLEAR_SELECTION(state) {
            state.selection = { type: null, waveIndex: null, opIndex: null };
          },
          UPDATE_SELECTION_AFTER_REMOVAL(state, { type, removedWaveIndex, removedOpIndex }) {
            // Mock implementation for tests
          }
        },
        actions: {
          selectOperation({ commit }, { waveIndex, opIndex }) {
            commit('SELECT_OPERATION', { waveIndex, opIndex });
          },
          selectWave({ commit }, { waveIndex }) {
            commit('SELECT_WAVE', { waveIndex });
          },
          clearSelection({ commit }) {
            commit('CLEAR_SELECTION');
          },
          toggleOperationSelection({ state, commit }, { waveIndex, opIndex }) {
            if (state.selection.type === 'operation' &&
                state.selection.waveIndex === waveIndex &&
                state.selection.opIndex === opIndex) {
              commit('CLEAR_SELECTION');
            } else {
              commit('SELECT_OPERATION', { waveIndex, opIndex });
            }
          },
          toggleWaveSelection({ state, commit }, { waveIndex }) {
            if (state.selection.type === 'wave' &&
                state.selection.waveIndex === waveIndex) {
              commit('CLEAR_SELECTION');
            } else {
              commit('SELECT_WAVE', { waveIndex });
            }
          },
          updateSelectionAfterRemoval({ commit }, payload) {
            commit('UPDATE_SELECTION_AFTER_REMOVAL', payload);
          },
          selectPasteTarget({ commit, rootGetters }, { preferredWaveIndex = null } = {}) {
            const waves = rootGetters['waves/waves'];
            if (preferredWaveIndex !== null && waves[preferredWaveIndex]) {
              commit('SELECT_WAVE', { waveIndex: preferredWaveIndex });
            } else if (waves.length > 0) {
              commit('SELECT_WAVE', { waveIndex: waves.length - 1 });
            } else {
              commit('CLEAR_SELECTION');
            }
          }
        }
      }
    },
    getters: {
      theme: (state, getters) => getters['ui/theme'],
      isDarkTheme: (state, getters) => getters['ui/isDarkTheme']
    },
    actions: {
      importData({ dispatch }, data) {
        if (data.fieldName !== undefined) {
          dispatch('field/setFieldName', data.fieldName);
        }
        if (data.rows !== undefined) {
          dispatch('field/setRows', data.rows);
        }
        if (data.cannons !== undefined) {
          dispatch('field/setCannons', data.cannons);
        }
        if (data.waves !== undefined) {
          dispatch('waves/setWaves', data.waves);
        }
      }
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
  
  // Default stubs for extracted components
  const defaultStubs = {
    ExportDialog: true,
    WaveHeader: true,
    OperationCard: true,
    ContextMenu: true
  };
  
  return mount(component, {
    global: {
      plugins: [store],
      stubs: {
        ...defaultStubs,
        ...(options.global?.stubs || {})
      },
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