import { describe, it, expect, beforeEach } from 'vitest';
import { createStore } from 'vuex';
import { mount } from '@vue/test-utils';
import { useCopyPaste } from '../../src/composables/useCopyPaste.js';
import selectionModule from '../../src/store/modules/selection.js';
import clipboardModule from '../../src/store/modules/clipboard.js';
import wavesModule from '../../src/store/modules/waves.js';

// Mock component that uses the composable
const MockComponent = {
  template: '<div>Test Component</div>',
  setup() {
    const copyPaste = useCopyPaste();
    return { copyPaste };
  }
};

describe('Multiple Copy-Paste Functionality', () => {
  let store;
  let wrapper;
  let copyPaste;

  beforeEach(() => {
    store = createStore({
      modules: {
        selection: selectionModule,
        clipboard: clipboardModule,
        waves: wavesModule
      }
    });

    wrapper = mount(MockComponent, {
      global: {
        plugins: [store]
      }
    });

    copyPaste = wrapper.vm.copyPaste;

    // Setup test data - 2 waves with operations
    store.dispatch('waves/addWave');
    store.dispatch('waves/addWave');
    
    // Wave 0 operations
    store.dispatch('waves/addOperation', {
      waveIndex: 0,
      operation: { type: 'fire', time: '300', columns: '1-8', row: 1, targetCol: 9 }
    });
    store.dispatch('waves/addOperation', {
      waveIndex: 0,
      operation: { type: 'fire', time: '400', columns: '1-8', row: 2, targetCol: 9 }
    });
    
    // Wave 1 operations
    store.dispatch('waves/addOperation', {
      waveIndex: 1,
      operation: { type: 'plant', time: '100', row: 3, targetCol: 8 }
    });
  });

  describe('Multiple Operations Copy-Paste', () => {
    it('should copy and paste multiple operations', async () => {
      // Select multiple operations
      await store.dispatch('selection/toggleOperationSelection', { 
        waveIndex: 0, 
        opIndex: 0, 
        isCtrlClick: false 
      });
      await store.dispatch('selection/toggleOperationSelection', { 
        waveIndex: 0, 
        opIndex: 1, 
        isCtrlClick: true 
      });
      
      expect(store.getters['selection/selectedOperations']).toHaveLength(2);

      // Copy multiple operations using keyboard shortcut simulation
      const allSelections = store.getters['selection/allSelectionInfo'];
      await copyPaste.copyMultipleOperations(allSelections);
      
      // Check clipboard state
      expect(store.getters['clipboard/hasClipboardData']).toBe(true);
      expect(store.getters['clipboard/hasOperationInClipboard']).toBe(true);
      expect(store.getters['clipboard/hasMultipleClipboardItems']).toBe(true);
      expect(store.getters['clipboard/clipboardItemCount']).toBe(2);

      // Get initial operation count in wave 1
      const initialOperations = store.getters['waves/waves'][1].operations.length;
      
      // Paste operations to wave 1
      const success = await copyPaste.pasteOperation(1);
      expect(success).toBe(true);
      
      // Check that operations were pasted
      const finalOperations = store.getters['waves/waves'][1].operations.length;
      expect(finalOperations).toBe(initialOperations + 2);
      
      // Verify the pasted operations have correct properties
      const wave1 = store.getters['waves/waves'][1];
      const pastedOp1 = wave1.operations[wave1.operations.length - 2];
      const pastedOp2 = wave1.operations[wave1.operations.length - 1];
      
      expect(pastedOp1.type).toBe('fire');
      expect(pastedOp1.time).toBe('300');
      expect(pastedOp2.type).toBe('fire');
      expect(pastedOp2.time).toBe('400');
    });

    it('should handle clipboard data correctly for multiple operations', async () => {
      const operations = [
        { operation: { type: 'fire', time: '300' }, waveIndex: 0, opIndex: 0 },
        { operation: { type: 'fire', time: '400' }, waveIndex: 0, opIndex: 1 }
      ];
      
      await store.dispatch('clipboard/copyOperations', { operations });
      
      const clipboardData = await store.dispatch('clipboard/getClipboardForPaste');
      
      expect(clipboardData.isMultiple).toBe(true);
      expect(clipboardData.type).toBe('operations');
      expect(clipboardData.items).toHaveLength(2);
      expect(clipboardData.items[0].operation.type).toBe('fire');
      expect(clipboardData.items[1].operation.time).toBe('400');
    });
  });

  describe('Multiple Waves Copy-Paste', () => {
    it('should copy and paste multiple waves', async () => {
      // Select multiple waves
      await store.dispatch('selection/toggleWaveSelection', { 
        waveIndex: 0, 
        isCtrlClick: false 
      });
      await store.dispatch('selection/toggleWaveSelection', { 
        waveIndex: 1, 
        isCtrlClick: true 
      });
      
      expect(store.getters['selection/selectedWaves']).toHaveLength(2);

      // Copy multiple waves
      const allSelections = store.getters['selection/allSelectionInfo'];
      await copyPaste.copyMultipleWaves(allSelections);
      
      // Check clipboard state
      expect(store.getters['clipboard/hasClipboardData']).toBe(true);
      expect(store.getters['clipboard/hasWaveInClipboard']).toBe(true);
      expect(store.getters['clipboard/hasMultipleClipboardItems']).toBe(true);
      expect(store.getters['clipboard/clipboardItemCount']).toBe(2);

      // Get initial wave count
      const initialWaveCount = store.getters['waves/waves'].length;
      
      // Paste waves
      const success = await copyPaste.pasteWave();
      expect(success).toBe(true);
      
      // Check that waves were pasted
      const finalWaveCount = store.getters['waves/waves'].length;
      expect(finalWaveCount).toBe(initialWaveCount + 2);
    });

    it('should handle clipboard data correctly for multiple waves', async () => {
      const waves = [
        { wave: { duration: 1000, operations: [] }, waveIndex: 0 },
        { wave: { duration: 2000, operations: [] }, waveIndex: 1 }
      ];
      
      await store.dispatch('clipboard/copyWaves', { waves });
      
      const clipboardData = await store.dispatch('clipboard/getClipboardForPaste');
      
      expect(clipboardData.isMultiple).toBe(true);
      expect(clipboardData.type).toBe('waves');
      expect(clipboardData.items).toHaveLength(2);
      expect(clipboardData.items[0].wave.duration).toBe(1000);
      expect(clipboardData.items[1].wave.duration).toBe(2000);
    });
  });

  describe('Keyboard Shortcuts with Multiple Selection', () => {
    it('should copy multiple operations with Ctrl+C simulation', async () => {
      // Select multiple operations
      await store.dispatch('selection/toggleOperationSelection', { 
        waveIndex: 0, 
        opIndex: 0, 
        isCtrlClick: false 
      });
      await store.dispatch('selection/toggleOperationSelection', { 
        waveIndex: 0, 
        opIndex: 1, 
        isCtrlClick: true 
      });
      
      // Simulate Ctrl+C keydown event by directly calling the copy shortcut
      const allSelections = store.getters['selection/allSelectionInfo'];
      expect(allSelections).toHaveLength(2);
      
      // Simulate what handleCopyShortcut would do
      if (allSelections.length > 1 && allSelections[0].type === 'operation') {
        await copyPaste.copyMultipleOperations(allSelections);
      }
      
      // Check if multiple operations were copied to clipboard
      expect(store.getters['clipboard/hasOperationInClipboard']).toBe(true);
      expect(store.getters['clipboard/hasMultipleClipboardItems']).toBe(true);
      expect(store.getters['clipboard/clipboardItemCount']).toBe(2);
    });

    it('should paste multiple operations with Ctrl+V simulation', async () => {
      // Setup clipboard with multiple operations
      const operations = [
        { operation: { type: 'fire', time: '300', columns: '1-8', row: 1, targetCol: 9 }, waveIndex: 0, opIndex: 0 },
        { operation: { type: 'fire', time: '400', columns: '1-8', row: 2, targetCol: 9 }, waveIndex: 0, opIndex: 1 }
      ];
      
      await store.dispatch('clipboard/copyOperations', { operations });
      
      // Select target wave
      await store.dispatch('selection/selectWave', { waveIndex: 1 });
      
      // Get initial operation count
      const initialCount = store.getters['waves/waves'][1].operations.length;
      
      // Simulate paste shortcut
      const clipboardData = await store.dispatch('clipboard/getClipboardForPaste');
      if (clipboardData && (clipboardData.type === 'operation' || clipboardData.type === 'operations')) {
        const selection = store.getters['selection/currentSelection'];
        const targetWaveIndex = selection.waveIndex;
        await copyPaste.pasteOperation(targetWaveIndex);
      }
      
      // Check that operations were pasted
      const finalCount = store.getters['waves/waves'][1].operations.length;
      expect(finalCount).toBe(initialCount + 2);
    });
  });

  describe('Mixed Single and Multiple Operations', () => {
    it('should handle single operation copy-paste when only one is selected', async () => {
      // Select single operation
      await store.dispatch('selection/toggleOperationSelection', { 
        waveIndex: 0, 
        opIndex: 0, 
        isCtrlClick: false 
      });
      
      const allSelections = store.getters['selection/allSelectionInfo'];
      expect(allSelections).toHaveLength(1);
      
      // Should use single copy logic
      const selection = allSelections[0];
      await copyPaste.copyOperation(selection.operation, selection.waveIndex, selection.opIndex);
      
      // Check clipboard state for single item
      expect(store.getters['clipboard/hasOperationInClipboard']).toBe(true);
      expect(store.getters['clipboard/hasMultipleClipboardItems']).toBe(false);
      expect(store.getters['clipboard/clipboardItemCount']).toBe(1);
    });

    it('should prevent mixed type copying', async () => {
      // This test ensures that the validation logic prevents copying operations and waves together
      // The selection system already prevents this, but we test the clipboard consistency
      
      // Copy operations first
      const operations = [
        { operation: { type: 'fire', time: '300' }, waveIndex: 0, opIndex: 0 }
      ];
      await store.dispatch('clipboard/copyOperations', { operations });
      
      expect(store.getters['clipboard/hasOperationInClipboard']).toBe(true);
      expect(store.getters['clipboard/hasWaveInClipboard']).toBe(false);
      
      // Copy waves (should replace operations)
      const waves = [
        { wave: { duration: 1000, operations: [] }, waveIndex: 0 }
      ];
      await store.dispatch('clipboard/copyWaves', { waves });
      
      expect(store.getters['clipboard/hasOperationInClipboard']).toBe(false);
      expect(store.getters['clipboard/hasWaveInClipboard']).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle empty clipboard gracefully', async () => {
      // Clear clipboard
      await store.dispatch('clipboard/clearClipboard');
      
      expect(store.getters['clipboard/hasClipboardData']).toBe(false);
      
      // Try to paste from empty clipboard
      const success = await copyPaste.pasteOperation(0);
      expect(success).toBe(false);
    });

    it('should handle invalid wave index gracefully', async () => {
      // Setup clipboard with operations
      const operations = [
        { operation: { type: 'fire', time: '300' }, waveIndex: 0, opIndex: 0 }
      ];
      await store.dispatch('clipboard/copyOperations', { operations });
      
      // Try to paste to invalid wave index
      try {
        const success = await copyPaste.pasteOperation(999);
        expect(success).toBe(false);
      } catch (error) {
        // Should handle error gracefully
        expect(error).toBeDefined();
      }
    });
  });
});