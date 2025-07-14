/**
 * Copy-Paste composable for CobPlanner
 * Provides copy-paste functionality for operations and waves
 */

import { computed, onMounted, onUnmounted } from 'vue';
import { useStore } from 'vuex';

export function useCopyPaste(enableKeyboardShortcuts = true) {
  const store = useStore();
  
  // Computed properties for clipboard state
  const hasClipboardData = computed(() => store.getters['clipboard/hasClipboardData']);
  const hasOperationInClipboard = computed(() => store.getters['clipboard/hasOperationInClipboard']);
  const hasWaveInClipboard = computed(() => store.getters['clipboard/hasWaveInClipboard']);
  const clipboardContent = computed(() => store.getters['clipboard/clipboardContent']);
  const shouldShowPasteZones = computed(() => store.getters['clipboard/shouldShowPasteZones']);
  
  // Check if an item is currently copied (for visual feedback)
  const isItemCopied = (itemId) => store.getters['clipboard/isItemCopied'](itemId);
  
  // Copy operations
  const copyOperation = (operation, waveIndex, opIndex) => {
    store.dispatch('clipboard/copyOperation', {
      operation,
      waveIndex,
      opIndex
    });
    
    // Show visual feedback
    showToast('操作已复制到剪贴板');
  };
  
  const copyWave = (wave, waveIndex) => {
    store.dispatch('clipboard/copyWave', {
      wave,
      waveIndex
    });
    
    // Show visual feedback
    showToast('波次已复制到剪贴板');
  };
  
  // Copy multiple operations
  const copyMultipleOperations = (selections) => {
    const operations = selections.map(sel => ({
      operation: sel.operation,
      waveIndex: sel.waveIndex,
      opIndex: sel.opIndex
    }));
    
    store.dispatch('clipboard/copyOperations', { operations });
    
    // Show visual feedback
    showToast(`已复制 ${operations.length} 个操作到剪贴板`);
  };
  
  // Copy multiple waves
  const copyMultipleWaves = (selections) => {
    const waves = selections.map(sel => ({
      wave: sel.wave,
      waveIndex: sel.waveIndex
    }));
    
    store.dispatch('clipboard/copyWaves', { waves });
    
    // Show visual feedback
    showToast(`已复制 ${waves.length} 个波次到剪贴板`);
  };
  
  // Paste operations
  const pasteOperation = async (targetWaveIndex, targetOpIndex = null) => {
    const clipboardData = await store.dispatch('clipboard/getClipboardForPaste');
    
    if (!clipboardData) {
      showToast('剪贴板中没有可粘贴的内容', 'error');
      return false;
    }
    
    // Handle multiple operations
    if (clipboardData.isMultiple && clipboardData.type === 'operations') {
      return await pasteMultipleOperations(targetWaveIndex, clipboardData.items);
    }
    
    // Handle single operation (legacy)
    if (!clipboardData.isMultiple && clipboardData.type === 'operation') {
      try {
        // Create a new operation from clipboard data
        const newOperation = {
          ...clipboardData.data,
          // Generate a new unique identifier if needed
          id: generateOperationId()
        };
        
        // Add the operation to the target wave
        if (targetOpIndex !== null) {
          // Insert at specific position
          await store.dispatch('waves/insertOperation', {
            waveIndex: targetWaveIndex,
            opIndex: targetOpIndex,
            operation: newOperation
          });
        } else {
          // Add at the end of the wave
          await store.dispatch('waves/addOperation', {
            waveIndex: targetWaveIndex,
            operation: newOperation
          });
        }
        
        showToast('操作已粘贴');
        return true;
      } catch (error) {
        console.error('Error pasting operation:', error);
        showToast('粘贴操作失败', 'error');
        return false;
      }
    }
    
    showToast('剪贴板中没有可粘贴的操作', 'error');
    return false;
  };
  
  // Paste multiple operations
  const pasteMultipleOperations = async (targetWaveIndex, operations) => {
    try {
      let successCount = 0;
      
      for (const opData of operations) {
        // Create a new operation from clipboard data
        const newOperation = {
          ...opData.operation,
          // Generate a new unique identifier
          id: generateOperationId()
        };
        
        // Add the operation to the target wave
        await store.dispatch('waves/addOperation', {
          waveIndex: targetWaveIndex,
          operation: newOperation
        });
        
        successCount++;
      }
      
      showToast(`已粘贴 ${successCount} 个操作`);
      return true;
    } catch (error) {
      console.error('Error pasting multiple operations:', error);
      showToast('粘贴多个操作失败', 'error');
      return false;
    }
  };
  
  const pasteWave = async (targetIndex = null) => {
    const clipboardData = await store.dispatch('clipboard/getClipboardForPaste');
    
    if (!clipboardData) {
      showToast('剪贴板中没有可粘贴的内容', 'error');
      return false;
    }
    
    // Handle multiple waves
    if (clipboardData.isMultiple && clipboardData.type === 'waves') {
      return await pasteMultipleWaves(clipboardData.items);
    }
    
    // Handle single wave (legacy)
    if (!clipboardData.isMultiple && clipboardData.type === 'wave') {
      try {
        // Create a new wave from clipboard data
        const newWave = {
          ...clipboardData.data,
          // Deep clone operations to avoid reference issues
          operations: clipboardData.data.operations.map(op => ({
            ...op,
            id: generateOperationId()
          }))
        };
        
        // Add the wave
        await store.dispatch('waves/addWave');
        
        // Get the new wave index (last wave)
        const waves = store.getters['waves/waves'];
        const newWaveIndex = waves.length - 1;
        
        // Update the wave with clipboard data
        await store.dispatch('waves/updateWave', {
          index: newWaveIndex,
          wave: newWave
        });
        
        showToast('波次已粘贴');
        return true;
      } catch (error) {
        console.error('Error pasting wave:', error);
        showToast('粘贴波次失败', 'error');
        return false;
      }
    }
    
    showToast('剪贴板中没有可粘贴的波次', 'error');
    return false;
  };
  
  // Paste multiple waves
  const pasteMultipleWaves = async (waves) => {
    try {
      let successCount = 0;
      
      for (const waveData of waves) {
        // Create a new wave from clipboard data
        const newWave = {
          ...waveData.wave,
          // Deep clone operations to avoid reference issues
          operations: waveData.wave.operations.map(op => ({
            ...op,
            id: generateOperationId()
          }))
        };
        
        // Add the wave
        await store.dispatch('waves/addWave');
        
        // Get the new wave index (last wave)
        const currentWaves = store.getters['waves/waves'];
        const newWaveIndex = currentWaves.length - 1;
        
        // Update the wave with clipboard data
        await store.dispatch('waves/updateWave', {
          index: newWaveIndex,
          wave: newWave
        });
        
        successCount++;
      }
      
      showToast(`已粘贴 ${successCount} 个波次`);
      return true;
    } catch (error) {
      console.error('Error pasting multiple waves:', error);
      showToast('粘贴多个波次失败', 'error');
      return false;
    }
  };
  
  // Duplicate operations (copy + paste in same location)
  const duplicateOperation = async (operation, waveIndex, opIndex) => {
    copyOperation(operation, waveIndex, opIndex);
    return await pasteOperation(waveIndex);
  };
  
  const duplicateWave = async (wave, waveIndex) => {
    copyWave(wave, waveIndex);
    return await pasteWave();
  };
  
  // Clear clipboard
  const clearClipboard = () => {
    store.dispatch('clipboard/clearClipboard');
  };
  
  // Clear selection
  const clearSelection = () => {
    store.dispatch('selection/clearSelection');
  };
  
  // Keyboard shortcuts handler
  const handleKeyboardShortcuts = (event) => {
    // Handle Escape key (no modifier needed)
    if (event.key === 'Escape') {
      clearClipboard();
      clearSelection();
      event.preventDefault();
      return;
    }
    
    // Only handle other keys if Ctrl or Cmd is pressed
    if (!(event.ctrlKey || event.metaKey)) return;
    
    switch (event.key.toLowerCase()) {
      case 'c':
        // Copy selected item
        handleCopyShortcut();
        event.preventDefault();
        break;
        
      case 'v':
        // Paste to selected location or appropriate target
        handlePasteShortcut();
        event.preventDefault();
        break;
    }
  };
  
  // Handle copy keyboard shortcut
  const handleCopyShortcut = () => {
    // Get all selected items for multiple selection support
    const allSelections = store.getters['selection/allSelectionInfo'];
    if (!allSelections || allSelections.length === 0) return;
    
    if (allSelections.length === 1) {
      // Single item - use existing single copy logic
      const selection = allSelections[0];
      if (selection.type === 'operation' && selection.operation) {
        copyOperation(selection.operation, selection.waveIndex, selection.opIndex);
      } else if (selection.type === 'wave' && selection.wave) {
        copyWave(selection.wave, selection.waveIndex);
      }
    } else {
      // Multiple items - use new multiple copy logic
      if (allSelections[0].type === 'operation') {
        copyMultipleOperations(allSelections);
      } else if (allSelections[0].type === 'wave') {
        copyMultipleWaves(allSelections);
      }
    }
  };
  
  // Handle paste keyboard shortcut
  const handlePasteShortcut = async () => {
    const clipboardData = await store.dispatch('clipboard/getClipboardForPaste');
    if (!clipboardData) return;
    
    const selection = store.getters['selection/currentSelection'];
    
    // Handle operations (single or multiple)
    if (clipboardData.type === 'operation' || clipboardData.type === 'operations') {
      // Determine target wave index
      let targetWaveIndex = null;
      
      if (selection.type === 'operation' || selection.type === 'wave') {
        // Use selected wave
        targetWaveIndex = selection.waveIndex;
      } else {
        // Use last wave as fallback
        const waves = store.getters['waves/waves'];
        if (waves.length > 0) {
          targetWaveIndex = waves.length - 1;
        }
      }
      
      if (targetWaveIndex !== null) {
        await pasteOperation(targetWaveIndex);
      }
    } 
    // Handle waves (single or multiple)
    else if (clipboardData.type === 'wave' || clipboardData.type === 'waves') {
      await pasteWave();
    }
  };
  
  // Utility functions
  const generateOperationId = () => {
    return `op-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };
  
  const showToast = (message, type = 'success') => {
    // Simple notification implementation
    // Create a temporary notification element
    const notification = document.createElement('div');
    notification.className = `toast-notification toast-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 16px;
      background: ${type === 'error' ? '#dc3545' : '#198754'};
      color: white;
      border-radius: 4px;
      z-index: 9999;
      font-size: 14px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      animation: slideIn 0.3s ease-out;
    `;
    
    // Add CSS animation
    if (!document.querySelector('#toast-styles')) {
      const style = document.createElement('style');
      style.id = 'toast-styles';
      style.textContent = `
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-in';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  };
  
  // Show/hide paste zones
  const showPasteZones = () => {
    store.dispatch('clipboard/showPasteZones');
  };
  
  const hidePasteZones = () => {
    store.dispatch('clipboard/hidePasteZones');
  };
  
  // Auto cleanup old clipboard data
  const cleanupClipboard = () => {
    store.dispatch('clipboard/cleanupOldClipboard');
  };
  
  // Setup keyboard listeners (only if enabled)
  onMounted(() => {
    if (enableKeyboardShortcuts) {
      document.addEventListener('keydown', handleKeyboardShortcuts);
    }
    
    // Cleanup old clipboard data on mount
    cleanupClipboard();
  });
  
  onUnmounted(() => {
    if (enableKeyboardShortcuts) {
      document.removeEventListener('keydown', handleKeyboardShortcuts);
    }
  });
  
  return {
    // State
    hasClipboardData,
    hasOperationInClipboard,
    hasWaveInClipboard,
    clipboardContent,
    shouldShowPasteZones,
    isItemCopied,
    
    // Actions
    copyOperation,
    copyWave,
    copyMultipleOperations,
    copyMultipleWaves,
    pasteOperation,
    pasteWave,
    pasteMultipleOperations,
    pasteMultipleWaves,
    duplicateOperation,
    duplicateWave,
    clearClipboard,
    clearSelection,
    
    // UI helpers
    showPasteZones,
    hidePasteZones,
    
    // Utilities
    generateOperationId
  };
}