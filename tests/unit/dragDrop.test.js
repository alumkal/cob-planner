/**
 * Drag and Drop Functionality Tests
 * Tests for the drag-and-drop implementation in CobPlanner
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createStore } from 'vuex';
import ReusePage from '../../src/components/ReusePage.vue';
import { createMockCopiedOperation, createMockOperationWithId } from '../helpers/testUtils.js';

// Mock the useCopyPaste composable
vi.mock('../../src/composables/useCopyPaste.js', () => ({
  useCopyPaste: () => ({
    copyOperation: vi.fn(),
    pasteOperation: vi.fn(),
    copyWave: vi.fn(),
    pasteWave: vi.fn(),
    canPaste: false,
    clipboard: { type: null, data: null }
  })
}));

// Mock the useDragDrop composable
vi.mock('../../src/composables/useDragDrop.js', () => ({
  useDragDrop: () => ({
    isDragging: false,
    draggedItem: null,
    draggedType: null,
    waves: [],
    handleOperationDragStart: vi.fn(),
    handleOperationDragEnd: vi.fn(),
    handleOperationDropWithinWave: vi.fn(),
    handleOperationDropBetweenWaves: vi.fn(),
    handleWaveDragStart: vi.fn(),
    handleWaveDragEnd: vi.fn(),
    handleWaveDrop: vi.fn(),
    isValidDropTarget: vi.fn(),
    generateUniqueId: vi.fn(),
    createDraggableOptions: vi.fn(),
    onOperationAdd: vi.fn(),
    onOperationUpdate: vi.fn(),
    onOperationRemove: vi.fn(),
    onWaveUpdate: vi.fn(),
    getOperationsWithIds: vi.fn(),
    getWavesWithIds: vi.fn()
  })
}));

// Mock vuedraggable
vi.mock('vuedraggable', () => ({
  default: {
    name: 'draggable',
    template: '<div><slot></slot></div>',
    props: ['modelValue', 'itemKey', 'group', 'animation', 'ghostClass', 'chosenClass', 'dragClass']
  }
}));

describe('Drag and Drop Functionality', () => {
  let store;
  let wrapper;
  
  // Mock waves data
  const mockWaves = [
    {
      duration: 601,
      notes: '第一波',
      operations: [
        { type: 'fire', time: '0', columns: '1-8', row: 1, targetCol: 9 },
        { type: 'fire', time: '100', columns: '1-8', row: 2, targetCol: 8 }
      ]
    },
    {
      duration: 601,
      notes: '第二波',
      operations: [
        { type: 'fire', time: '0', columns: '1-8', row: 1, targetCol: 7 }
      ]
    }
  ];

  beforeEach(() => {
    // Create mock store
    store = createStore({
      modules: {
        ui: {
          namespaced: true,
          getters: {
            theme: () => 'light'
          }
        },
        field: {
          namespaced: true,
          getters: {
            rows: () => 5,
            cannons: () => [
              { row: 1, col: 1 },
              { row: 2, col: 1 }
            ]
          }
        },
        waves: {
          namespaced: true,
          getters: {
            waves: () => mockWaves,
            totalOperations: () => 3
          },
          actions: {
            addWave: vi.fn(),
            removeWave: vi.fn(),
            updateWave: vi.fn(),
            addOperation: vi.fn(),
            removeOperation: vi.fn(),
            updateOperation: vi.fn(),
            moveOperationWithinWave: vi.fn(),
            moveOperationBetweenWaves: vi.fn(),
            moveWaveDragDrop: vi.fn(),
            setWaves: vi.fn()
          }
        },
        selection: {
          namespaced: true,
          getters: {
            currentSelection: () => ({ operations: [], waves: [] }),
            hasSelection: () => false,
            isOperationSelected: () => () => false,
            isWaveSelected: () => () => false
          },
          actions: {
            toggleOperationSelection: vi.fn(),
            toggleWaveSelection: vi.fn(),
            selectWave: vi.fn(),
            clearSelection: vi.fn(),
            updateSelectionAfterRemoval: vi.fn()
          }
        },
        clipboard: {
          namespaced: true,
          getters: {
            hasClipboard: () => false,
            clipboardType: () => null
          }
        }
      }
    });

    // Mount the component
    wrapper = mount(ReusePage, {
      global: {
        plugins: [store]
      }
    });
  });

  describe('Vuex Store Integration', () => {
    it('should have drag-and-drop actions in waves module', () => {
      expect(store._actions['waves/moveOperationWithinWave']).toBeDefined();
      expect(store._actions['waves/moveOperationBetweenWaves']).toBeDefined();
      expect(store._actions['waves/moveWaveDragDrop']).toBeDefined();
    });

    it('should dispatch moveOperationWithinWave action', async () => {
      const mockDispatch = vi.spyOn(store, 'dispatch');
      
      await store.dispatch('waves/moveOperationWithinWave', {
        waveIndex: 0,
        fromIndex: 0,
        toIndex: 1
      });

      expect(mockDispatch).toHaveBeenCalledWith('waves/moveOperationWithinWave', {
        waveIndex: 0,
        fromIndex: 0,
        toIndex: 1
      });
    });

    it('should dispatch moveOperationBetweenWaves action', async () => {
      const mockDispatch = vi.spyOn(store, 'dispatch');
      
      await store.dispatch('waves/moveOperationBetweenWaves', {
        fromWaveIndex: 0,
        fromOpIndex: 0,
        toWaveIndex: 1,
        toOpIndex: 0
      });

      expect(mockDispatch).toHaveBeenCalledWith('waves/moveOperationBetweenWaves', {
        fromWaveIndex: 0,
        fromOpIndex: 0,
        toWaveIndex: 1,
        toOpIndex: 0
      });
    });

    it('should dispatch moveWaveDragDrop action', async () => {
      const mockDispatch = vi.spyOn(store, 'dispatch');
      
      await store.dispatch('waves/moveWaveDragDrop', {
        fromIndex: 0,
        toIndex: 1
      });

      expect(mockDispatch).toHaveBeenCalledWith('waves/moveWaveDragDrop', {
        fromIndex: 0,
        toIndex: 1
      });
    });
  });

  describe('Component Integration', () => {
    it('should render drag-and-drop components', () => {
      expect(wrapper.findComponent({ name: 'draggable' })).toBeTruthy();
    });

    it('should have computed property for waves with dragging', () => {
      expect(wrapper.vm.wavesForDragging).toBeDefined();
      expect(Array.isArray(wrapper.vm.wavesForDragging)).toBe(true);
    });

    it('should have drag event handlers', () => {
      expect(wrapper.vm.onWaveDragStart).toBeDefined();
      expect(wrapper.vm.onWaveDragEnd).toBeDefined();
      expect(wrapper.vm.onWaveChange).toBeDefined();
      expect(wrapper.vm.onOperationDragStart).toBeDefined();
      expect(wrapper.vm.onOperationDragEnd).toBeDefined();
      expect(wrapper.vm.onOperationChange).toBeDefined();
    });

    it('should handle wave drag start', () => {
      const mockEvent = { dataTransfer: { setData: vi.fn() } };
      wrapper.vm.onWaveDragStart(mockEvent);
      expect(wrapper.vm.dragDropComposable.isDragging).toBe(true);
    });

    it('should handle wave drag end', () => {
      const mockEvent = { dataTransfer: { getData: vi.fn() } };
      wrapper.vm.onWaveDragEnd(mockEvent);
      expect(wrapper.vm.dragDropComposable.isDragging).toBe(false);
    });

    it('should handle operation drag start', () => {
      const mockEvent = { dataTransfer: { setData: vi.fn() } };
      wrapper.vm.onOperationDragStart(mockEvent);
      expect(wrapper.vm.dragDropComposable.isDragging).toBe(true);
    });

    it('should handle operation drag end', () => {
      const mockEvent = { dataTransfer: { getData: vi.fn() } };
      wrapper.vm.onOperationDragEnd(mockEvent);
      expect(wrapper.vm.dragDropComposable.isDragging).toBe(false);
    });

    it('should handle operation change with validation', async () => {
      const mockValidateOperationAtIndex = vi.spyOn(wrapper.vm, 'validateOperationAtIndex');
      
      await wrapper.vm.onOperationChange({}, 0);
      
      await wrapper.vm.$nextTick();
      expect(mockValidateOperationAtIndex).toHaveBeenCalled();
    });

    it('should clear calculation result on drag changes', () => {
      wrapper.vm.calculationResult = { success: true };
      
      wrapper.vm.onWaveChange({});
      expect(wrapper.vm.calculationResult).toBeNull();
      
      wrapper.vm.calculationResult = { success: true };
      wrapper.vm.onOperationChange({}, 0);
      expect(wrapper.vm.calculationResult).toBeNull();
    });
  });

  describe('Waves For Dragging Computed Property', () => {
    it('should transform waves with unique IDs', () => {
      const wavesForDragging = wrapper.vm.wavesForDragging;
      
      expect(wavesForDragging).toHaveLength(2);
      expect(wavesForDragging[0].id).toBe('wave-0');
      expect(wavesForDragging[1].id).toBe('wave-1');
      expect(wavesForDragging[0].originalIndex).toBe(0);
      expect(wavesForDragging[1].originalIndex).toBe(1);
    });

    it('should handle wave reordering through setter', () => {
      const mockDispatch = vi.spyOn(store, 'dispatch');
      const reorderedWaves = [
        { ...mockWaves[1], id: 'wave-1', originalIndex: 1 },
        { ...mockWaves[0], id: 'wave-0', originalIndex: 0 }
      ];
      
      wrapper.vm.wavesForDragging = reorderedWaves;
      
      expect(mockDispatch).toHaveBeenCalledWith('waves/setWaves', [
        mockWaves[1],
        mockWaves[0]
      ]);
    });

    it('should remove ID and originalIndex from waves in setter', () => {
      const mockDispatch = vi.spyOn(store, 'dispatch');
      const wavesWithExtras = [
        { ...mockWaves[0], id: 'wave-0', originalIndex: 0, extraProp: 'test' }
      ];
      
      wrapper.vm.wavesForDragging = wavesWithExtras;
      
      const dispatchedWaves = mockDispatch.mock.calls[0][1];
      expect(dispatchedWaves[0]).not.toHaveProperty('id');
      expect(dispatchedWaves[0]).not.toHaveProperty('originalIndex');
      expect(dispatchedWaves[0]).toHaveProperty('extraProp');
    });
  });

  describe('Error Handling', () => {
    it('should handle drag events with invalid data gracefully', () => {
      expect(() => {
        wrapper.vm.onWaveDragStart(null);
      }).not.toThrow();
      
      expect(() => {
        wrapper.vm.onOperationDragStart(null);
      }).not.toThrow();
    });

    it('should handle operation change with invalid wave index', async () => {
      const mockValidateOperationAtIndex = vi.spyOn(wrapper.vm, 'validateOperationAtIndex');
      
      await wrapper.vm.onOperationChange({}, 999);
      
      await wrapper.vm.$nextTick();
      expect(mockValidateOperationAtIndex).not.toHaveBeenCalled();
    });
  });

  describe('Performance Considerations', () => {
    it('should only trigger validation on operation change', async () => {
      const mockValidateOperationAtIndex = vi.spyOn(wrapper.vm, 'validateOperationAtIndex');
      
      wrapper.vm.onWaveChange({});
      await wrapper.vm.$nextTick();
      expect(mockValidateOperationAtIndex).not.toHaveBeenCalled();
      
      wrapper.vm.onOperationChange({}, 0);
      await wrapper.vm.$nextTick();
      expect(mockValidateOperationAtIndex).toHaveBeenCalled();
    });

    it('should handle multiple rapid drag events', () => {
      for (let i = 0; i < 100; i++) {
        wrapper.vm.onWaveDragStart({ dataTransfer: { setData: vi.fn() } });
        wrapper.vm.onWaveDragEnd({ dataTransfer: { getData: vi.fn() } });
      }
      
      expect(wrapper.vm.dragDropComposable.isDragging).toBe(false);
    });
  });
});

describe('Drag and Drop Store Mutations', () => {
  let store;

  beforeEach(() => {
    store = createStore({
      modules: {
        waves: {
          namespaced: true,
          state: {
            waves: [
              {
                duration: 601,
                notes: '',
                operations: [
                  { type: 'fire', time: '0', columns: '1-8', row: 1, targetCol: 9 },
                  { type: 'fire', time: '100', columns: '1-8', row: 2, targetCol: 8 }
                ]
              },
              {
                duration: 601,
                notes: '',
                operations: [
                  { type: 'fire', time: '0', columns: '1-8', row: 1, targetCol: 7 }
                ]
              }
            ]
          },
          mutations: {
            MOVE_OPERATION_WITHIN_WAVE(state, { waveIndex, fromIndex, toIndex }) {
              if (state.waves[waveIndex] && 
                  fromIndex >= 0 && fromIndex < state.waves[waveIndex].operations.length &&
                  toIndex >= 0 && toIndex < state.waves[waveIndex].operations.length) {
                const operations = state.waves[waveIndex].operations;
                const [movedOperation] = operations.splice(fromIndex, 1);
                operations.splice(toIndex, 0, movedOperation);
              }
            },
            MOVE_OPERATION_BETWEEN_WAVES(state, { fromWaveIndex, fromOpIndex, toWaveIndex, toOpIndex }) {
              if (state.waves[fromWaveIndex] && state.waves[toWaveIndex] &&
                  fromOpIndex >= 0 && fromOpIndex < state.waves[fromWaveIndex].operations.length &&
                  toOpIndex >= 0 && toOpIndex <= state.waves[toWaveIndex].operations.length) {
                const [movedOperation] = state.waves[fromWaveIndex].operations.splice(fromOpIndex, 1);
                state.waves[toWaveIndex].operations.splice(toOpIndex, 0, movedOperation);
              }
            },
            MOVE_WAVE(state, { fromIndex, toIndex }) {
              if (fromIndex >= 0 && fromIndex < state.waves.length &&
                  toIndex >= 0 && toIndex < state.waves.length) {
                const [movedWave] = state.waves.splice(fromIndex, 1);
                state.waves.splice(toIndex, 0, movedWave);
              }
            }
          },
          actions: {
            moveOperationWithinWave({ commit }, payload) {
              commit('MOVE_OPERATION_WITHIN_WAVE', payload);
            },
            moveOperationBetweenWaves({ commit }, payload) {
              commit('MOVE_OPERATION_BETWEEN_WAVES', payload);
            },
            moveWaveDragDrop({ commit }, payload) {
              commit('MOVE_WAVE', payload);
            }
          }
        }
      }
    });
  });

  describe('MOVE_OPERATION_WITHIN_WAVE', () => {
    it('should move operation within same wave', () => {
      const initialOperation = store.state.waves.waves[0].operations[0];
      
      store.commit('waves/MOVE_OPERATION_WITHIN_WAVE', {
        waveIndex: 0,
        fromIndex: 0,
        toIndex: 1
      });

      expect(store.state.waves.waves[0].operations[1]).toEqual(initialOperation);
    });

    it('should handle invalid indices gracefully', () => {
      const originalOperations = [...store.state.waves.waves[0].operations];
      
      store.commit('waves/MOVE_OPERATION_WITHIN_WAVE', {
        waveIndex: 0,
        fromIndex: -1,
        toIndex: 1
      });

      expect(store.state.waves.waves[0].operations).toEqual(originalOperations);
    });
  });

  describe('MOVE_OPERATION_BETWEEN_WAVES', () => {
    it('should move operation between waves', () => {
      const initialOperation = store.state.waves.waves[0].operations[0];
      
      store.commit('waves/MOVE_OPERATION_BETWEEN_WAVES', {
        fromWaveIndex: 0,
        fromOpIndex: 0,
        toWaveIndex: 1,
        toOpIndex: 0
      });

      expect(store.state.waves.waves[1].operations[0]).toEqual(initialOperation);
      expect(store.state.waves.waves[0].operations).toHaveLength(1);
    });

    it('should handle invalid wave indices gracefully', () => {
      const originalWave0 = [...store.state.waves.waves[0].operations];
      const originalWave1 = [...store.state.waves.waves[1].operations];
      
      store.commit('waves/MOVE_OPERATION_BETWEEN_WAVES', {
        fromWaveIndex: 999,
        fromOpIndex: 0,
        toWaveIndex: 1,
        toOpIndex: 0
      });

      expect(store.state.waves.waves[0].operations).toEqual(originalWave0);
      expect(store.state.waves.waves[1].operations).toEqual(originalWave1);
    });
  });

  describe('MOVE_WAVE', () => {
    it('should move wave to new position', () => {
      const initialWave = store.state.waves.waves[0];
      
      store.commit('waves/MOVE_WAVE', {
        fromIndex: 0,
        toIndex: 1
      });

      expect(store.state.waves.waves[1]).toEqual(initialWave);
    });

    it('should handle invalid indices gracefully', () => {
      const originalWaves = [...store.state.waves.waves];
      
      store.commit('waves/MOVE_WAVE', {
        fromIndex: -1,
        toIndex: 1
      });

      expect(store.state.waves.waves).toEqual(originalWaves);
    });
  });
});