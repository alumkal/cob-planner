import { describe, it, expect, beforeEach } from 'vitest';
import { createStore } from 'vuex';
import selectionModule from '../../src/store/modules/selection.js';
import wavesModule from '../../src/store/modules/waves.js';

describe('Multiple Selection Functionality', () => {
  let store;

  beforeEach(() => {
    store = createStore({
      modules: {
        selection: selectionModule,
        waves: wavesModule
      }
    });

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

  describe('Operation Multi-Selection', () => {
    it('should allow selecting multiple operations with Ctrl+click', async () => {
      // First operation selection (normal click)
      await store.dispatch('selection/toggleOperationSelection', { 
        waveIndex: 0, 
        opIndex: 0, 
        isCtrlClick: false 
      });
      
      expect(store.getters['selection/isOperationSelected'](0, 0)).toBe(true);
      expect(store.getters['selection/selectedOperations']).toHaveLength(1);
      expect(store.getters['selection/selectionType']).toBe('operations');

      // Second operation selection (Ctrl+click)
      await store.dispatch('selection/toggleOperationSelection', { 
        waveIndex: 0, 
        opIndex: 1, 
        isCtrlClick: true 
      });
      
      expect(store.getters['selection/isOperationSelected'](0, 0)).toBe(true);
      expect(store.getters['selection/isOperationSelected'](0, 1)).toBe(true);
      expect(store.getters['selection/selectedOperations']).toHaveLength(2);
      expect(store.getters['selection/hasMultipleSelection']).toBe(true);
    });

    it('should deselect operation with Ctrl+click if already selected', async () => {
      // Select first operation
      await store.dispatch('selection/toggleOperationSelection', { 
        waveIndex: 0, 
        opIndex: 0, 
        isCtrlClick: false 
      });
      
      // Select second operation with Ctrl+click
      await store.dispatch('selection/toggleOperationSelection', { 
        waveIndex: 0, 
        opIndex: 1, 
        isCtrlClick: true 
      });
      
      expect(store.getters['selection/selectedOperations']).toHaveLength(2);

      // Deselect first operation with Ctrl+click
      await store.dispatch('selection/toggleOperationSelection', { 
        waveIndex: 0, 
        opIndex: 0, 
        isCtrlClick: true 
      });
      
      expect(store.getters['selection/isOperationSelected'](0, 0)).toBe(false);
      expect(store.getters['selection/isOperationSelected'](0, 1)).toBe(true);
      expect(store.getters['selection/selectedOperations']).toHaveLength(1);
    });

    it('should clear all selections when normal clicking on unselected operation', async () => {
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

      // Normal click on different operation should clear previous selections
      await store.dispatch('selection/toggleOperationSelection', { 
        waveIndex: 1, 
        opIndex: 0, 
        isCtrlClick: false 
      });
      
      expect(store.getters['selection/isOperationSelected'](0, 0)).toBe(false);
      expect(store.getters['selection/isOperationSelected'](0, 1)).toBe(false);
      expect(store.getters['selection/isOperationSelected'](1, 0)).toBe(true);
      expect(store.getters['selection/selectedOperations']).toHaveLength(1);
    });

    it('should deselect all when normal clicking on the only selected operation', async () => {
      // Select single operation
      await store.dispatch('selection/toggleOperationSelection', { 
        waveIndex: 0, 
        opIndex: 0, 
        isCtrlClick: false 
      });
      
      expect(store.getters['selection/selectedOperations']).toHaveLength(1);

      // Normal click on same operation should deselect it
      await store.dispatch('selection/toggleOperationSelection', { 
        waveIndex: 0, 
        opIndex: 0, 
        isCtrlClick: false 
      });
      
      expect(store.getters['selection/hasSelection']).toBe(false);
      expect(store.getters['selection/selectedOperations']).toHaveLength(0);
      expect(store.getters['selection/selectionType']).toBe(null);
    });
  });

  describe('Wave Multi-Selection', () => {
    it('should allow selecting multiple waves with Ctrl+click', async () => {
      // First wave selection (normal click)
      await store.dispatch('selection/toggleWaveSelection', { 
        waveIndex: 0, 
        isCtrlClick: false 
      });
      
      expect(store.getters['selection/isWaveSelected'](0)).toBe(true);
      expect(store.getters['selection/selectedWaves']).toHaveLength(1);
      expect(store.getters['selection/selectionType']).toBe('waves');

      // Second wave selection (Ctrl+click)
      await store.dispatch('selection/toggleWaveSelection', { 
        waveIndex: 1, 
        isCtrlClick: true 
      });
      
      expect(store.getters['selection/isWaveSelected'](0)).toBe(true);
      expect(store.getters['selection/isWaveSelected'](1)).toBe(true);
      expect(store.getters['selection/selectedWaves']).toHaveLength(2);
      expect(store.getters['selection/hasMultipleSelection']).toBe(true);
    });

    it('should deselect wave with Ctrl+click if already selected', async () => {
      // Select both waves
      await store.dispatch('selection/toggleWaveSelection', { 
        waveIndex: 0, 
        isCtrlClick: false 
      });
      await store.dispatch('selection/toggleWaveSelection', { 
        waveIndex: 1, 
        isCtrlClick: true 
      });
      
      expect(store.getters['selection/selectedWaves']).toHaveLength(2);

      // Deselect first wave with Ctrl+click
      await store.dispatch('selection/toggleWaveSelection', { 
        waveIndex: 0, 
        isCtrlClick: true 
      });
      
      expect(store.getters['selection/isWaveSelected'](0)).toBe(false);
      expect(store.getters['selection/isWaveSelected'](1)).toBe(true);
      expect(store.getters['selection/selectedWaves']).toHaveLength(1);
    });
  });

  describe('Mixed Selection Prevention', () => {
    it('should clear wave selections when selecting operations', async () => {
      // First select waves
      await store.dispatch('selection/toggleWaveSelection', { 
        waveIndex: 0, 
        isCtrlClick: false 
      });
      await store.dispatch('selection/toggleWaveSelection', { 
        waveIndex: 1, 
        isCtrlClick: true 
      });
      
      expect(store.getters['selection/selectedWaves']).toHaveLength(2);
      expect(store.getters['selection/selectionType']).toBe('waves');

      // Now select an operation - should clear wave selections
      await store.dispatch('selection/toggleOperationSelection', { 
        waveIndex: 0, 
        opIndex: 0, 
        isCtrlClick: false 
      });
      
      expect(store.getters['selection/selectedWaves']).toHaveLength(0);
      expect(store.getters['selection/selectedOperations']).toHaveLength(1);
      expect(store.getters['selection/selectionType']).toBe('operations');
      expect(store.getters['selection/isWaveSelected'](0)).toBe(false);
      expect(store.getters['selection/isWaveSelected'](1)).toBe(false);
      expect(store.getters['selection/isOperationSelected'](0, 0)).toBe(true);
    });

    it('should clear operation selections when selecting waves', async () => {
      // First select operations
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
      expect(store.getters['selection/selectionType']).toBe('operations');

      // Now select a wave - should clear operation selections
      await store.dispatch('selection/toggleWaveSelection', { 
        waveIndex: 1, 
        isCtrlClick: false 
      });
      
      expect(store.getters['selection/selectedOperations']).toHaveLength(0);
      expect(store.getters['selection/selectedWaves']).toHaveLength(1);
      expect(store.getters['selection/selectionType']).toBe('waves');
      expect(store.getters['selection/isOperationSelected'](0, 0)).toBe(false);
      expect(store.getters['selection/isOperationSelected'](0, 1)).toBe(false);
      expect(store.getters['selection/isWaveSelected'](1)).toBe(true);
    });
  });

  describe('Selection Information Getters', () => {
    it('should return all selection info for multiple operations', async () => {
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
      await store.dispatch('selection/toggleOperationSelection', { 
        waveIndex: 1, 
        opIndex: 0, 
        isCtrlClick: true 
      });
      
      const allSelections = store.getters['selection/allSelectionInfo'];
      expect(allSelections).toHaveLength(3);
      
      expect(allSelections[0]).toMatchObject({
        type: 'operation',
        waveIndex: 0,
        opIndex: 0
      });
      expect(allSelections[1]).toMatchObject({
        type: 'operation',
        waveIndex: 0,
        opIndex: 1
      });
      expect(allSelections[2]).toMatchObject({
        type: 'operation',
        waveIndex: 1,
        opIndex: 0
      });
    });

    it('should return all selection info for multiple waves', async () => {
      // Select multiple waves
      await store.dispatch('selection/toggleWaveSelection', { 
        waveIndex: 0, 
        isCtrlClick: false 
      });
      await store.dispatch('selection/toggleWaveSelection', { 
        waveIndex: 1, 
        isCtrlClick: true 
      });
      
      const allSelections = store.getters['selection/allSelectionInfo'];
      expect(allSelections).toHaveLength(2);
      
      expect(allSelections[0]).toMatchObject({
        type: 'wave',
        waveIndex: 0
      });
      expect(allSelections[1]).toMatchObject({
        type: 'wave',
        waveIndex: 1
      });
    });

    it('should maintain backward compatibility with legacy selectionInfo getter', async () => {
      // Select operation
      await store.dispatch('selection/toggleOperationSelection', { 
        waveIndex: 0, 
        opIndex: 0, 
        isCtrlClick: false 
      });
      
      // Legacy getter should return first selected item
      const legacySelection = store.getters['selection/selectionInfo'];
      expect(legacySelection).toMatchObject({
        type: 'operation',
        waveIndex: 0,
        opIndex: 0
      });

      // Legacy currentSelection getter should work
      const currentSelection = store.getters['selection/currentSelection'];
      expect(currentSelection).toMatchObject({
        type: 'operation',
        waveIndex: 0,
        opIndex: 0
      });
    });
  });

  describe('Selection Updates After Removal', () => {
    it('should update multiple operation selections when operation is removed', async () => {
      // Select multiple operations in wave 0
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

      // Remove first operation (index 0)
      await store.dispatch('selection/updateSelectionAfterRemoval', { 
        type: 'operation', 
        removedWaveIndex: 0,
        removedOpIndex: 0 
      });
      
      // First operation should be removed from selection, second should have adjusted index
      const selectedOps = store.getters['selection/selectedOperations'];
      expect(selectedOps).toHaveLength(1);
      expect(selectedOps[0]).toMatchObject({ waveIndex: 0, opIndex: 0 }); // was index 1, now 0
    });

    it('should update multiple wave selections when wave is removed', async () => {
      // Add a third wave for testing
      await store.dispatch('waves/addWave');
      
      // Select multiple waves
      await store.dispatch('selection/toggleWaveSelection', { 
        waveIndex: 0, 
        isCtrlClick: false 
      });
      await store.dispatch('selection/toggleWaveSelection', { 
        waveIndex: 1, 
        isCtrlClick: true 
      });
      await store.dispatch('selection/toggleWaveSelection', { 
        waveIndex: 2, 
        isCtrlClick: true 
      });
      
      expect(store.getters['selection/selectedWaves']).toHaveLength(3);

      // Remove middle wave (index 1)
      await store.dispatch('selection/updateSelectionAfterRemoval', { 
        type: 'wave', 
        removedWaveIndex: 1
      });
      
      // Wave 1 should be removed, wave 2 should become wave 1
      const selectedWaves = store.getters['selection/selectedWaves'];
      expect(selectedWaves).toHaveLength(2);
      expect(selectedWaves).toContain(0); // unchanged
      expect(selectedWaves).toContain(1); // was 2, now 1
      expect(selectedWaves).not.toContain(2);
    });
  });

  describe('Clear Selection', () => {
    it('should clear all types of selections', async () => {
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
      
      expect(store.getters['selection/hasSelection']).toBe(true);
      expect(store.getters['selection/hasMultipleSelection']).toBe(true);

      // Clear selection
      await store.dispatch('selection/clearSelection');
      
      expect(store.getters['selection/hasSelection']).toBe(false);
      expect(store.getters['selection/hasMultipleSelection']).toBe(false);
      expect(store.getters['selection/selectedOperations']).toHaveLength(0);
      expect(store.getters['selection/selectedWaves']).toHaveLength(0);
      expect(store.getters['selection/selectionType']).toBe(null);
    });
  });
});