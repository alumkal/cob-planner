/**
 * Tests for copy-paste functionality
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createStore } from 'vuex';
import clipboard from '../../src/store/modules/clipboard.js';
import waves from '../../src/store/modules/waves.js';

describe('Copy-Paste Functionality', () => {
  let store;
  
  beforeEach(() => {
    store = createStore({
      modules: {
        clipboard,
        waves
      }
    });
  });

  describe('Clipboard Store', () => {
    it('should start with empty clipboard', () => {
      expect(store.getters['clipboard/hasClipboardData']).toBe(false);
      expect(store.getters['clipboard/clipboardContent'].type).toBe(null);
    });

    it('should copy operation to clipboard', () => {
      const operation = {
        type: 'fire',
        time: '300',
        columns: '1-8',
        row: 1,
        targetCol: 9
      };

      store.dispatch('clipboard/copyOperation', {
        operation,
        waveIndex: 0,
        opIndex: 0
      });

      expect(store.getters['clipboard/hasClipboardData']).toBe(true);
      expect(store.getters['clipboard/hasOperationInClipboard']).toBe(true);
      expect(store.getters['clipboard/clipboardContent'].type).toBe('operation');
      expect(store.getters['clipboard/clipboardContent'].data).toEqual(operation);
    });

    it('should copy wave to clipboard', () => {
      const wave = {
        duration: 601,
        notes: 'Test wave',
        operations: [
          {
            type: 'fire',
            time: '300',
            columns: '1-8',
            row: 1,
            targetCol: 9
          }
        ]
      };

      store.dispatch('clipboard/copyWave', {
        wave,
        waveIndex: 0
      });

      expect(store.getters['clipboard/hasClipboardData']).toBe(true);
      expect(store.getters['clipboard/hasWaveInClipboard']).toBe(true);
      expect(store.getters['clipboard/clipboardContent'].type).toBe('wave');
      expect(store.getters['clipboard/clipboardContent'].data).toEqual(wave);
    });

    it('should clear clipboard', () => {
      // First copy something
      store.dispatch('clipboard/copyOperation', {
        operation: { type: 'fire', time: '300' },
        waveIndex: 0,
        opIndex: 0
      });

      expect(store.getters['clipboard/hasClipboardData']).toBe(true);

      // Then clear
      store.dispatch('clipboard/clearClipboard');

      expect(store.getters['clipboard/hasClipboardData']).toBe(false);
      expect(store.getters['clipboard/clipboardContent'].type).toBe(null);
    });

    it('should provide clipboard data for pasting', async () => {
      const operation = {
        type: 'fire',
        time: '300',
        columns: '1-8',
        row: 1,
        targetCol: 9
      };

      store.dispatch('clipboard/copyOperation', {
        operation,
        waveIndex: 0,
        opIndex: 0
      });

      const clipboardData = await store.dispatch('clipboard/getClipboardForPaste');

      expect(clipboardData).not.toBe(null);
      expect(clipboardData.type).toBe('operation');
      expect(clipboardData.data).toEqual(operation);
      // Should be a deep clone, not the same object
      expect(clipboardData.data).not.toBe(operation);
    });

    it('should return null when no clipboard data for pasting', async () => {
      const clipboardData = await store.dispatch('clipboard/getClipboardForPaste');
      expect(clipboardData).toBe(null);
    });
  });

  describe('Wave Operations with Copy-Paste', () => {
    beforeEach(() => {
      // Add a test wave
      store.dispatch('waves/addWave');
    });

    it('should add operation from clipboard data structure', () => {
      const operation = {
        type: 'fire',
        time: '300',
        columns: '1-8',
        row: 1,
        targetCol: 9
      };

      // Simulate adding operation (like paste would do)
      store.dispatch('waves/addOperation', {
        waveIndex: 0,
        operation
      });

      const waves = store.getters['waves/waves'];
      expect(waves[0].operations).toHaveLength(1);
      expect(waves[0].operations[0]).toEqual(operation);
    });

    it('should insert operation at specific position', () => {
      // Add some operations first
      store.dispatch('waves/addOperation', {
        waveIndex: 0,
        operation: { type: 'fire', time: '100' }
      });
      store.dispatch('waves/addOperation', {
        waveIndex: 0,
        operation: { type: 'fire', time: '300' }
      });

      // Insert in the middle
      const newOperation = { type: 'fire', time: '200' };
      store.dispatch('waves/insertOperation', {
        waveIndex: 0,
        opIndex: 1,
        operation: newOperation
      });

      const waves = store.getters['waves/waves'];
      expect(waves[0].operations).toHaveLength(3);
      expect(waves[0].operations[1]).toEqual(newOperation);
      expect(waves[0].operations[1].time).toBe('200');
    });

    it('should handle clipboard data deep cloning', () => {
      const originalOperation = {
        type: 'fire',
        time: '300',
        columns: '1-8',
        row: 1,
        targetCol: 9,
        nested: { value: 'test' }
      };

      store.dispatch('clipboard/copyOperation', {
        operation: originalOperation,
        waveIndex: 0,
        opIndex: 0
      });

      const clipboardData = store.getters['clipboard/clipboardContent'];
      
      // Modify the original
      originalOperation.time = '400';
      originalOperation.nested.value = 'modified';

      // Clipboard should be unaffected
      expect(clipboardData.data.time).toBe('300');
      expect(clipboardData.data.nested.value).toBe('test');
    });
  });

  describe('Clipboard Age and Cleanup', () => {
    it('should track clipboard age', () => {
      store.dispatch('clipboard/copyOperation', {
        operation: { type: 'fire', time: '300' },
        waveIndex: 0,
        opIndex: 0
      });

      const age = store.getters['clipboard/clipboardAge'];
      expect(age).toBe(0); // Should be 0 seconds old (just created)
    });

    it('should handle empty clipboard age', () => {
      const age = store.getters['clipboard/clipboardAge'];
      expect(age).toBe(null);
    });
  });
});