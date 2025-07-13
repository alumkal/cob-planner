/**
 * Undo/Redo composable for CobPlanner
 * Integrates VueUse's useRefHistory with Vuex store
 */

import { computed, watch } from 'vue';
import { useRefHistory } from '@vueuse/core';
import { useStore } from 'vuex';

export function useUndoRedo() {
  const store = useStore();
  
  // Create computed refs for the state we want to track
  const fieldState = computed({
    get: () => ({
      fieldName: store.getters['field/fieldName'],
      rows: store.getters['field/rows'],
      cannons: [...store.getters['field/cannons']] // Clone array to ensure reactivity
    }),
    set: (value) => {
      // This will be handled by the restore action
      store.dispatch('restoreFieldState', value);
    }
  });
  
  const wavesState = computed({
    get: () => ({
      waves: [...store.getters['waves/waves']] // Clone array to ensure reactivity
    }),
    set: (value) => {
      // This will be handled by the restore action
      store.dispatch('restoreWavesState', value);
    }
  });
  
  // Set up history tracking for field state
  const fieldHistory = useRefHistory(fieldState, {
    deep: true,
    capacity: 50,
    flush: 'sync'
  });
  
  // Set up history tracking for waves state
  const wavesHistory = useRefHistory(wavesState, {
    deep: true,
    capacity: 50,
    flush: 'sync'
  });
  
  // Combined undo/redo functionality
  const canUndo = computed(() => 
    fieldHistory.canUndo.value || wavesHistory.canUndo.value
  );
  
  const canRedo = computed(() => 
    fieldHistory.canRedo.value || wavesHistory.canRedo.value
  );
  
  // Track which history has the most recent change
  let lastFieldChange = 0;
  let lastWavesChange = 0;
  
  watch(fieldState, () => {
    lastFieldChange = Date.now();
  }, { deep: true });
  
  watch(wavesState, () => {
    lastWavesChange = Date.now();
  }, { deep: true });
  
  const undo = () => {
    // Determine which state was changed more recently and undo that
    if (lastFieldChange > lastWavesChange && fieldHistory.canUndo.value) {
      fieldHistory.undo();
    } else if (wavesHistory.canUndo.value) {
      wavesHistory.undo();
    } else if (fieldHistory.canUndo.value) {
      fieldHistory.undo();
    }
  };
  
  const redo = () => {
    // Determine which state to redo based on recent changes
    if (lastFieldChange > lastWavesChange && fieldHistory.canRedo.value) {
      fieldHistory.redo();
    } else if (wavesHistory.canRedo.value) {
      wavesHistory.redo();
    } else if (fieldHistory.canRedo.value) {
      fieldHistory.redo();
    }
  };
  
  const clearHistory = () => {
    fieldHistory.clear();
    wavesHistory.clear();
  };
  
  return {
    // State
    canUndo,
    canRedo,
    
    // Actions
    undo,
    redo,
    clearHistory,
    
    // History details (for debugging or advanced features)
    fieldHistory: fieldHistory.history,
    wavesHistory: wavesHistory.history
  };
}