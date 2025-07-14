/**
 * Clipboard module for Vuex store
 * Manages copy-paste functionality for operations and waves
 */

const state = () => ({
  // Current clipboard content
  clipboard: {
    type: null, // 'operation' | 'wave' | 'operations' | 'waves' | null
    data: null, // The copied data (single item or array for multiple)
    items: [], // Array of copied items for multiple selection
    sourceInfo: null, // Source context information
    timestamp: null // When the copy was made
  },
  // Visual feedback state
  copiedItemId: null, // ID of currently copied item for visual feedback
  showPasteZones: false // Whether to show paste zones in UI
});

const getters = {
  // Check if clipboard has content
  hasClipboardData: (state) => state.clipboard.type !== null && 
    (state.clipboard.data !== null || state.clipboard.items.length > 0),
  
  // Get clipboard content
  clipboardContent: (state) => state.clipboard,
  
  // Check if clipboard contains specific type
  hasOperationInClipboard: (state) => 
    state.clipboard.type === 'operation' || state.clipboard.type === 'operations',
  hasWaveInClipboard: (state) => 
    state.clipboard.type === 'wave' || state.clipboard.type === 'waves',
  
  // Check if clipboard has multiple items
  hasMultipleClipboardItems: (state) => 
    state.clipboard.type === 'operations' || state.clipboard.type === 'waves',
  
  // Get clipboard item count
  clipboardItemCount: (state) => {
    if (state.clipboard.type === 'operations' || state.clipboard.type === 'waves') {
      return state.clipboard.items.length;
    }
    return state.clipboard.data ? 1 : 0;
  },
  
  // Check if an item is currently copied (for visual feedback)
  isItemCopied: (state) => (itemId) => state.copiedItemId === itemId,
  
  // Whether to show paste zones
  shouldShowPasteZones: (state) => state.showPasteZones,
  
  // Get clipboard age in seconds
  clipboardAge: (state) => {
    if (!state.clipboard.timestamp) return null;
    return Math.floor((Date.now() - state.clipboard.timestamp) / 1000);
  }
};

const mutations = {
  // Set clipboard content (single item)
  SET_CLIPBOARD(state, { type, data, sourceInfo = null }) {
    state.clipboard = {
      type,
      data: JSON.parse(JSON.stringify(data)), // Deep clone to prevent reference issues
      items: [],
      sourceInfo,
      timestamp: Date.now()
    };
    
    // Generate a visual feedback ID
    state.copiedItemId = `${type}-${Date.now()}`;
  },
  
  // Set multiple items in clipboard
  SET_MULTIPLE_CLIPBOARD(state, { type, items, sourceInfo = null }) {
    state.clipboard = {
      type, // 'operations' or 'waves'
      data: null,
      items: JSON.parse(JSON.stringify(items)), // Deep clone array
      sourceInfo,
      timestamp: Date.now()
    };
    
    // Generate a visual feedback ID
    state.copiedItemId = `${type}-${Date.now()}`;
  },
  
  // Clear clipboard
  CLEAR_CLIPBOARD(state) {
    state.clipboard = {
      type: null,
      data: null,
      items: [],
      sourceInfo: null,
      timestamp: null
    };
    state.copiedItemId = null;
  },
  
  // Set visual feedback for copied item
  SET_COPIED_ITEM_ID(state, itemId) {
    state.copiedItemId = itemId;
  },
  
  // Control paste zone visibility
  SET_SHOW_PASTE_ZONES(state, show) {
    state.showPasteZones = show;
  }
};

const actions = {
  // Copy an operation
  copyOperation({ commit }, { operation, waveIndex, opIndex }) {
    const sourceInfo = {
      waveIndex,
      opIndex,
      originalWave: waveIndex
    };
    
    commit('SET_CLIPBOARD', {
      type: 'operation',
      data: operation,
      sourceInfo
    });
  },
  
  // Copy multiple operations
  copyOperations({ commit }, { operations }) {
    // operations is an array of {operation, waveIndex, opIndex}
    const sourceInfo = {
      count: operations.length,
      type: 'operations'
    };
    
    commit('SET_MULTIPLE_CLIPBOARD', {
      type: 'operations',
      items: operations,
      sourceInfo
    });
  },
  
  // Copy a wave
  copyWave({ commit }, { wave, waveIndex }) {
    const sourceInfo = {
      waveIndex,
      originalWaveIndex: waveIndex
    };
    
    commit('SET_CLIPBOARD', {
      type: 'wave',
      data: wave,
      sourceInfo
    });
  },
  
  // Copy multiple waves
  copyWaves({ commit }, { waves }) {
    // waves is an array of {wave, waveIndex}
    const sourceInfo = {
      count: waves.length,
      type: 'waves'
    };
    
    commit('SET_MULTIPLE_CLIPBOARD', {
      type: 'waves',
      items: waves,
      sourceInfo
    });
  },
  
  // Clear clipboard
  clearClipboard({ commit }) {
    commit('CLEAR_CLIPBOARD');
  },
  
  // Get clipboard content for pasting
  getClipboardForPaste({ getters }) {
    if (!getters.hasClipboardData) {
      return null;
    }
    
    const clipboard = getters.clipboardContent;
    
    // Handle multiple items
    if (clipboard.type === 'operations' || clipboard.type === 'waves') {
      return {
        type: clipboard.type,
        items: JSON.parse(JSON.stringify(clipboard.items)),
        sourceInfo: clipboard.sourceInfo,
        isMultiple: true
      };
    }
    
    // Handle single item (legacy)
    return {
      type: clipboard.type,
      data: JSON.parse(JSON.stringify(clipboard.data)),
      sourceInfo: clipboard.sourceInfo,
      isMultiple: false
    };
  },
  
  // Show paste zones (when user hovers over pasteable areas)
  showPasteZones({ commit }) {
    commit('SET_SHOW_PASTE_ZONES', true);
  },
  
  // Hide paste zones
  hidePasteZones({ commit }) {
    commit('SET_SHOW_PASTE_ZONES', false);
  },
  
  // Auto-clear old clipboard data (optional cleanup)
  cleanupOldClipboard({ commit, getters }) {
    const maxAge = 30 * 60; // 30 minutes in seconds
    const age = getters.clipboardAge;
    
    if (age && age > maxAge) {
      commit('CLEAR_CLIPBOARD');
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