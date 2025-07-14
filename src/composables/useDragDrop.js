/**
 * Composable for drag and drop functionality
 * Provides reusable drag-and-drop logic for operations and waves
 */

import { ref, computed } from 'vue';
import { useStore } from 'vuex';

export function useDragDrop() {
  const store = useStore();
  
  // Drag state
  const isDragging = ref(false);
  const draggedItem = ref(null);
  const draggedType = ref(null); // 'operation' or 'wave'
  
  // Computed properties for reactive data
  const waves = computed(() => store.getters['waves/waves']);
  
  // Operation drag and drop handlers
  const handleOperationDragStart = (evt, waveIndex, opIndex) => {
    isDragging.value = true;
    draggedItem.value = { waveIndex, opIndex };
    draggedType.value = 'operation';
    
    // Store the original data for potential restoration
    const operation = waves.value[waveIndex].operations[opIndex];
    evt.dataTransfer.setData('text/plain', JSON.stringify({
      type: 'operation',
      waveIndex,
      opIndex,
      operation
    }));
  };
  
  const handleOperationDragEnd = () => {
    isDragging.value = false;
    draggedItem.value = null;
    draggedType.value = null;
  };
  
  // Handle operation drop within same wave
  const handleOperationDropWithinWave = (evt, waveIndex, newIndex) => {
    if (draggedType.value !== 'operation') return;
    
    const { waveIndex: fromWaveIndex, opIndex: fromOpIndex } = draggedItem.value;
    
    // If dropping in the same wave, reorder operations
    if (fromWaveIndex === waveIndex) {
      store.dispatch('waves/moveOperationWithinWave', {
        waveIndex,
        fromIndex: fromOpIndex,
        toIndex: newIndex
      });
    } else {
      // If dropping in different wave, move operation between waves
      store.dispatch('waves/moveOperationBetweenWaves', {
        fromWaveIndex,
        fromOpIndex,
        toWaveIndex: waveIndex,
        toOpIndex: newIndex
      });
    }
    
    handleOperationDragEnd();
  };
  
  // Handle operation drop between waves
  const handleOperationDropBetweenWaves = (evt, fromWaveIndex, fromOpIndex, toWaveIndex, toOpIndex) => {
    store.dispatch('waves/moveOperationBetweenWaves', {
      fromWaveIndex,
      fromOpIndex,
      toWaveIndex,
      toOpIndex
    });
    
    handleOperationDragEnd();
  };
  
  // Wave drag and drop handlers
  const handleWaveDragStart = (evt, waveIndex) => {
    isDragging.value = true;
    draggedItem.value = { waveIndex };
    draggedType.value = 'wave';
    
    evt.dataTransfer.setData('text/plain', JSON.stringify({
      type: 'wave',
      waveIndex
    }));
  };
  
  const handleWaveDragEnd = () => {
    isDragging.value = false;
    draggedItem.value = null;
    draggedType.value = null;
  };
  
  const handleWaveDrop = (evt, newIndex) => {
    if (draggedType.value !== 'wave') return;
    
    const { waveIndex: fromIndex } = draggedItem.value;
    
    store.dispatch('waves/moveWaveDragDrop', {
      fromIndex,
      toIndex: newIndex
    });
    
    handleWaveDragEnd();
  };
  
  // Utility functions
  const isValidDropTarget = (targetType, draggedType) => {
    return targetType === draggedType;
  };
  
  const generateUniqueId = (waveIndex, opIndex) => {
    return `${waveIndex}-${opIndex}`;
  };
  
  const createDraggableOptions = (type, group = 'default') => {
    return {
      group,
      animation: 200,
      ghostClass: 'drag-ghost',
      chosenClass: 'drag-chosen',
      dragClass: 'drag-drag',
      forceFallback: true,
      fallbackClass: 'drag-fallback',
      fallbackOnBody: true,
      swapThreshold: 0.65,
      invertSwap: false,
      invertedSwapThreshold: 0.1,
      direction: type === 'operation' ? 'horizontal' : 'vertical',
      touchStartThreshold: 0,
      preventOnFilter: true,
      delay: 0,
      delayOnTouchOnly: false,
      disabled: false,
      store: null,
      scroll: true,
      scrollSensitivity: 30,
      scrollSpeed: 10,
      bubbleScroll: true,
      dragoverBubble: false,
      removeCloneOnHide: true,
      emptyInsertThreshold: 5
    };
  };
  
  // Operation list handlers for vuedraggable
  const onOperationAdd = (evt, waveIndex) => {
    const { newIndex, item } = evt;
    const dragData = JSON.parse(evt.dataTransfer?.getData('text/plain') || '{}');
    
    if (dragData.type === 'operation') {
      handleOperationDropWithinWave(evt, waveIndex, newIndex);
    }
  };
  
  const onOperationUpdate = (evt, waveIndex) => {
    const { newIndex, oldIndex } = evt;
    
    if (newIndex !== oldIndex) {
      store.dispatch('waves/moveOperationWithinWave', {
        waveIndex,
        fromIndex: oldIndex,
        toIndex: newIndex
      });
    }
  };
  
  const onOperationRemove = (evt, waveIndex) => {
    // Handle operation removal when dragged to another wave
    // This is handled by the target wave's onOperationAdd
  };
  
  // Wave list handlers for vuedraggable
  const onWaveUpdate = (evt) => {
    const { newIndex, oldIndex } = evt;
    
    if (newIndex !== oldIndex) {
      store.dispatch('waves/moveWaveDragDrop', {
        fromIndex: oldIndex,
        toIndex: newIndex
      });
    }
  };
  
  // Computed properties for operations with unique IDs
  const getOperationsWithIds = (waveIndex) => {
    return computed(() => {
      const wave = waves.value[waveIndex];
      if (!wave) return [];
      
      return wave.operations.map((operation, index) => ({
        ...operation,
        id: generateUniqueId(waveIndex, index),
        originalIndex: index
      }));
    });
  };
  
  const getWavesWithIds = () => {
    return computed(() => {
      return waves.value.map((wave, index) => ({
        ...wave,
        id: `wave-${index}`,
        originalIndex: index
      }));
    });
  };
  
  return {
    // State
    isDragging,
    draggedItem,
    draggedType,
    
    // Computed
    waves,
    
    // Operation handlers
    handleOperationDragStart,
    handleOperationDragEnd,
    handleOperationDropWithinWave,
    handleOperationDropBetweenWaves,
    
    // Wave handlers
    handleWaveDragStart,
    handleWaveDragEnd,
    handleWaveDrop,
    
    // Utility functions
    isValidDropTarget,
    generateUniqueId,
    createDraggableOptions,
    
    // Vuedraggable event handlers
    onOperationAdd,
    onOperationUpdate,
    onOperationRemove,
    onWaveUpdate,
    
    // Data helpers
    getOperationsWithIds,
    getWavesWithIds
  };
}