/**
 * Selection module for Vuex store
 * Manages currently selected operations and waves for keyboard shortcuts and visual feedback
 */

const state = () => ({
  // Current selection state
  selection: {
    type: null, // 'operation' | 'wave' | null
    waveIndex: null, // Index of selected wave
    opIndex: null // Index of selected operation (null for wave selection)
  }
});

const getters = {
  // Get current selection
  currentSelection: (state) => state.selection,
  
  // Check if anything is selected
  hasSelection: (state) => state.selection.type !== null,
  
  // Check if a specific operation is selected
  isOperationSelected: (state) => (waveIndex, opIndex) => {
    return state.selection.type === 'operation' &&
           state.selection.waveIndex === waveIndex &&
           state.selection.opIndex === opIndex;
  },
  
  // Check if a specific wave is selected
  isWaveSelected: (state) => (waveIndex) => {
    return state.selection.type === 'wave' &&
           state.selection.waveIndex === waveIndex;
  },
  
  // Get selected operation
  selectedOperation: (state, getters, rootState, rootGetters) => {
    if (state.selection.type !== 'operation') return null;
    
    const waves = rootGetters['waves/waves'];
    const wave = waves[state.selection.waveIndex];
    if (!wave) return null;
    
    return wave.operations[state.selection.opIndex] || null;
  },
  
  // Get selected wave
  selectedWave: (state, getters, rootState, rootGetters) => {
    if (state.selection.type !== 'wave') return null;
    
    const waves = rootGetters['waves/waves'];
    return waves[state.selection.waveIndex] || null;
  },
  
  // Get selection info for copy operations
  selectionInfo: (state, getters) => {
    if (!getters.hasSelection) return null;
    
    return {
      type: state.selection.type,
      waveIndex: state.selection.waveIndex,
      opIndex: state.selection.opIndex,
      item: state.selection.type === 'operation' ? getters.selectedOperation : getters.selectedWave
    };
  }
};

const mutations = {
  // Select an operation
  SELECT_OPERATION(state, { waveIndex, opIndex }) {
    state.selection = {
      type: 'operation',
      waveIndex,
      opIndex
    };
  },
  
  // Select a wave
  SELECT_WAVE(state, { waveIndex }) {
    state.selection = {
      type: 'wave',
      waveIndex,
      opIndex: null
    };
  },
  
  // Clear selection
  CLEAR_SELECTION(state) {
    state.selection = {
      type: null,
      waveIndex: null,
      opIndex: null
    };
  },
  
  // Update selection indices when items are removed
  UPDATE_SELECTION_AFTER_REMOVAL(state, { type, removedWaveIndex, removedOpIndex }) {
    if (!state.selection.type) return;
    
    if (type === 'wave' && state.selection.waveIndex === removedWaveIndex) {
      // Selected wave was removed, clear selection
      state.selection = {
        type: null,
        waveIndex: null,
        opIndex: null
      };
    } else if (type === 'wave' && state.selection.waveIndex > removedWaveIndex) {
      // Wave was removed before selected wave, adjust index
      state.selection.waveIndex--;
    } else if (type === 'operation' && 
               state.selection.type === 'operation' &&
               state.selection.waveIndex === removedWaveIndex &&
               state.selection.opIndex === removedOpIndex) {
      // Selected operation was removed, clear selection
      state.selection = {
        type: null,
        waveIndex: null,
        opIndex: null
      };
    } else if (type === 'operation' && 
               state.selection.type === 'operation' &&
               state.selection.waveIndex === removedWaveIndex &&
               state.selection.opIndex > removedOpIndex) {
      // Operation was removed before selected operation, adjust index
      state.selection.opIndex--;
    }
  }
};

const actions = {
  // Select an operation
  selectOperation({ commit }, { waveIndex, opIndex }) {
    commit('SELECT_OPERATION', { waveIndex, opIndex });
  },
  
  // Select a wave
  selectWave({ commit }, { waveIndex }) {
    commit('SELECT_WAVE', { waveIndex });
  },
  
  // Clear selection
  clearSelection({ commit }) {
    commit('CLEAR_SELECTION');
  },
  
  // Toggle selection - if same item is clicked, deselect it
  toggleOperationSelection({ state, commit }, { waveIndex, opIndex }) {
    if (state.selection.type === 'operation' &&
        state.selection.waveIndex === waveIndex &&
        state.selection.opIndex === opIndex) {
      commit('CLEAR_SELECTION');
    } else {
      commit('SELECT_OPERATION', { waveIndex, opIndex });
    }
  },
  
  // Toggle wave selection
  toggleWaveSelection({ state, commit }, { waveIndex }) {
    if (state.selection.type === 'wave' &&
        state.selection.waveIndex === waveIndex) {
      commit('CLEAR_SELECTION');
    } else {
      commit('SELECT_WAVE', { waveIndex });
    }
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