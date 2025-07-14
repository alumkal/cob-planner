/**
 * Selection module for Vuex store
 * Manages currently selected operations and waves for keyboard shortcuts and visual feedback
 * Supports multiple selection with Ctrl+click, but prevents mixing waves and operations
 */

const state = () => ({
  selectedOperations: [], // Array of {waveIndex, opIndex}
  selectedWaves: [], // Array of waveIndex
  selectionType: null // 'operations' | 'waves' | null
});

const getters = {
  // Get current selection (legacy getter for compatibility)
  currentSelection: (state) => ({
    type: state.selectionType === 'operations' ? 'operation' : 
          state.selectionType === 'waves' ? 'wave' : null,
    waveIndex: state.selectionType === 'operations' && state.selectedOperations.length > 0 
               ? state.selectedOperations[0].waveIndex
               : state.selectionType === 'waves' && state.selectedWaves.length > 0
               ? state.selectedWaves[0] : null,
    opIndex: state.selectionType === 'operations' && state.selectedOperations.length > 0 
             ? state.selectedOperations[0].opIndex : null
  }),
  
  // Check if anything is selected
  hasSelection: (state) => state.selectedOperations.length > 0 || state.selectedWaves.length > 0,
  
  // Check if multiple items are selected
  hasMultipleSelection: (state) => 
    state.selectedOperations.length > 1 || state.selectedWaves.length > 1,
  
  // Get all selected operations
  selectedOperations: (state) => state.selectedOperations,
  
  // Get all selected waves
  selectedWaves: (state) => state.selectedWaves,
  
  // Get selection type
  selectionType: (state) => state.selectionType,
  
  // Check if a specific operation is selected
  isOperationSelected: (state) => (waveIndex, opIndex) => {
    return state.selectedOperations.some(op => 
      op.waveIndex === waveIndex && op.opIndex === opIndex
    );
  },
  
  // Check if a specific wave is selected
  isWaveSelected: (state) => (waveIndex) => {
    return state.selectedWaves.includes(waveIndex);
  },
  
  // Get selection info for copy operations (returns first selected item for legacy support)
  selectionInfo: (state, getters, rootState, rootGetters) => {
    if (!state.selectionType) return null;
    
    if (state.selectionType === 'operations' && state.selectedOperations.length > 0) {
      const firstOp = state.selectedOperations[0];
      const waves = rootGetters['waves/waves'];
      const wave = waves[firstOp.waveIndex];
      if (!wave) return null;
      
      const operation = wave.operations[firstOp.opIndex];
      if (!operation) return null;
      
      return {
        type: 'operation',
        waveIndex: firstOp.waveIndex,
        opIndex: firstOp.opIndex,
        operation: operation
      };
    } else if (state.selectionType === 'waves' && state.selectedWaves.length > 0) {
      const firstWaveIndex = state.selectedWaves[0];
      const waves = rootGetters['waves/waves'];
      const wave = waves[firstWaveIndex];
      if (!wave) return null;
      
      return {
        type: 'wave',
        waveIndex: firstWaveIndex,
        wave: wave
      };
    }
    
    return null;
  },
  
  // Get all selection info for operations that support multiple items
  allSelectionInfo: (state, getters, rootState, rootGetters) => {
    const waves = rootGetters['waves/waves'];
    const result = [];
    
    if (state.selectionType === 'operations') {
      state.selectedOperations.forEach(op => {
        const wave = waves[op.waveIndex];
        if (wave && wave.operations[op.opIndex]) {
          result.push({
            type: 'operation',
            waveIndex: op.waveIndex,
            opIndex: op.opIndex,
            operation: wave.operations[op.opIndex]
          });
        }
      });
    } else if (state.selectionType === 'waves') {
      state.selectedWaves.forEach(waveIndex => {
        const wave = waves[waveIndex];
        if (wave) {
          result.push({
            type: 'wave',
            waveIndex: waveIndex,
            wave: wave
          });
        }
      });
    }
    
    return result;
  }
};

const mutations = {
  // Clear all selections
  CLEAR_SELECTION(state) {
    state.selectedOperations = [];
    state.selectedWaves = [];
    state.selectionType = null;
  },
  
  // Add operation to selection
  ADD_OPERATION_TO_SELECTION(state, { waveIndex, opIndex }) {
    // Clear waves if selecting operations (prevent mixing)
    if (state.selectionType === 'waves') {
      state.selectedWaves = [];
    }
    
    state.selectionType = 'operations';
    
    // Add if not already selected
    const existing = state.selectedOperations.find(op => 
      op.waveIndex === waveIndex && op.opIndex === opIndex
    );
    if (!existing) {
      state.selectedOperations.push({ waveIndex, opIndex });
    }
  },
  
  // Remove operation from selection
  REMOVE_OPERATION_FROM_SELECTION(state, { waveIndex, opIndex }) {
    state.selectedOperations = state.selectedOperations.filter(op => 
      !(op.waveIndex === waveIndex && op.opIndex === opIndex)
    );
    
    // Clear selection type if no items left
    if (state.selectedOperations.length === 0) {
      state.selectionType = null;
    }
  },
  
  // Add wave to selection
  ADD_WAVE_TO_SELECTION(state, { waveIndex }) {
    // Clear operations if selecting waves (prevent mixing)
    if (state.selectionType === 'operations') {
      state.selectedOperations = [];
    }
    
    state.selectionType = 'waves';
    
    // Add if not already selected
    if (!state.selectedWaves.includes(waveIndex)) {
      state.selectedWaves.push(waveIndex);
    }
  },
  
  // Remove wave from selection
  REMOVE_WAVE_FROM_SELECTION(state, { waveIndex }) {
    state.selectedWaves = state.selectedWaves.filter(w => w !== waveIndex);
    
    // Clear selection type if no items left
    if (state.selectedWaves.length === 0) {
      state.selectionType = null;
    }
  },
  
  // Select single operation (clears all other selections)
  SELECT_OPERATION(state, { waveIndex, opIndex }) {
    state.selectedOperations = [{ waveIndex, opIndex }];
    state.selectedWaves = [];
    state.selectionType = 'operations';
  },
  
  // Select single wave (clears all other selections) 
  SELECT_WAVE(state, { waveIndex }) {
    state.selectedWaves = [waveIndex];
    state.selectedOperations = [];
    state.selectionType = 'waves';
  },
  
  // Update selection indices when items are removed
  UPDATE_SELECTION_AFTER_REMOVAL(state, { type, removedWaveIndex, removedOpIndex }) {
    if (type === 'wave') {
      // Remove the specific wave if it's selected
      state.selectedWaves = state.selectedWaves.filter(w => w !== removedWaveIndex);
      
      // Adjust indices for waves after the removed wave
      state.selectedWaves = state.selectedWaves.map(w => 
        w > removedWaveIndex ? w - 1 : w
      );
      
      // Remove operations from the removed wave
      state.selectedOperations = state.selectedOperations.filter(op => 
        op.waveIndex !== removedWaveIndex
      );
      
      // Adjust wave indices for operations after the removed wave
      state.selectedOperations.forEach(op => {
        if (op.waveIndex > removedWaveIndex) {
          op.waveIndex--;
        }
      });
    } else if (type === 'operation') {
      // Remove the specific operation if it's selected
      state.selectedOperations = state.selectedOperations.filter(op => 
        !(op.waveIndex === removedWaveIndex && op.opIndex === removedOpIndex)
      );
      
      // Adjust operation indices for operations after the removed operation in the same wave
      state.selectedOperations.forEach(op => {
        if (op.waveIndex === removedWaveIndex && op.opIndex > removedOpIndex) {
          op.opIndex--;
        }
      });
    }
    
    // Clear selection type if no items left
    if (state.selectedOperations.length === 0 && state.selectedWaves.length === 0) {
      state.selectionType = null;
    }
  }
};

const actions = {
  // Select single operation (clears all other selections)
  selectOperation({ commit }, { waveIndex, opIndex }) {
    commit('SELECT_OPERATION', { waveIndex, opIndex });
  },
  
  // Select single wave (clears all other selections)
  selectWave({ commit }, { waveIndex }) {
    commit('SELECT_WAVE', { waveIndex });
  },
  
  // Clear all selections
  clearSelection({ commit }) {
    commit('CLEAR_SELECTION');
  },
  
  // Multiple selection actions
  
  // Toggle operation selection with Ctrl+click support
  toggleOperationSelection({ state, commit, getters }, { waveIndex, opIndex, isCtrlClick = false }) {
    const isSelected = getters.isOperationSelected(waveIndex, opIndex);
    
    if (isCtrlClick) {
      // Ctrl+click: add/remove from selection
      if (isSelected) {
        commit('REMOVE_OPERATION_FROM_SELECTION', { waveIndex, opIndex });
      } else {
        commit('ADD_OPERATION_TO_SELECTION', { waveIndex, opIndex });
      }
    } else {
      // Normal click: single selection or deselect if it's the only selected item
      if (isSelected && state.selectedOperations.length === 1) {
        commit('CLEAR_SELECTION');
      } else {
        commit('SELECT_OPERATION', { waveIndex, opIndex });
      }
    }
  },
  
  // Toggle wave selection with Ctrl+click support
  toggleWaveSelection({ state, commit, getters }, { waveIndex, isCtrlClick = false }) {
    const isSelected = getters.isWaveSelected(waveIndex);
    
    if (isCtrlClick) {
      // Ctrl+click: add/remove from selection
      if (isSelected) {
        commit('REMOVE_WAVE_FROM_SELECTION', { waveIndex });
      } else {
        commit('ADD_WAVE_TO_SELECTION', { waveIndex });
      }
    } else {
      // Normal click: single selection or deselect if it's the only selected item
      if (isSelected && state.selectedWaves.length === 1) {
        commit('CLEAR_SELECTION');
      } else {
        commit('SELECT_WAVE', { waveIndex });
      }
    }
  },
  
  // Add operation to multi-selection
  addOperationToSelection({ commit }, { waveIndex, opIndex }) {
    commit('ADD_OPERATION_TO_SELECTION', { waveIndex, opIndex });
  },
  
  // Remove operation from multi-selection  
  removeOperationFromSelection({ commit }, { waveIndex, opIndex }) {
    commit('REMOVE_OPERATION_FROM_SELECTION', { waveIndex, opIndex });
  },
  
  // Add wave to multi-selection
  addWaveToSelection({ commit }, { waveIndex }) {
    commit('ADD_WAVE_TO_SELECTION', { waveIndex });
  },
  
  // Remove wave from multi-selection
  removeWaveFromSelection({ commit }, { waveIndex }) {
    commit('REMOVE_WAVE_FROM_SELECTION', { waveIndex });
  },
  
  // Handle removal updates
  updateSelectionAfterRemoval({ commit }, { type, removedWaveIndex, removedOpIndex }) {
    commit('UPDATE_SELECTION_AFTER_REMOVAL', { type, removedWaveIndex, removedOpIndex });
  },
  
  // Smart selection for paste operations - select appropriate target
  selectPasteTarget({ commit, rootGetters }, { preferredWaveIndex = null } = {}) {
    const waves = rootGetters['waves/waves'];
    
    if (preferredWaveIndex !== null && waves[preferredWaveIndex]) {
      // Select the preferred wave
      commit('SELECT_WAVE', { waveIndex: preferredWaveIndex });
    } else if (waves.length > 0) {
      // Select the last wave as fallback
      commit('SELECT_WAVE', { waveIndex: waves.length - 1 });
    } else {
      // No waves available, clear selection
      commit('CLEAR_SELECTION');
    }
  }
};

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
};