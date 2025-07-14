import { describe, it, expect, beforeEach, vi } from 'vitest';
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

describe('Keyboard Shortcuts', () => {
  let store;
  let wrapper;

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

    // Setup test data
    store.dispatch('waves/addWave');
    store.dispatch('waves/addOperation', {
      waveIndex: 0,
      operation: {
        type: 'fire',
        time: '300',
        columns: '1-8',
        row: 1,
        targetCol: 9
      }
    });
  });

  describe('Copy Shortcut (Ctrl+C)', () => {
    it('should copy selected operation when Ctrl+C is pressed', async () => {
      // Select an operation first
      await store.dispatch('selection/selectOperation', { waveIndex: 0, opIndex: 0 });
      
      // Verify operation is selected
      expect(store.getters['selection/isOperationSelected'](0, 0)).toBe(true);
      
      // Get selection info
      const selectionInfo = store.getters['selection/selectionInfo'];
      expect(selectionInfo).toBeTruthy();
      expect(selectionInfo.type).toBe('operation');
      expect(selectionInfo.operation).toBeTruthy();
      
      // Simulate Ctrl+C keydown event
      const event = new KeyboardEvent('keydown', { 
        key: 'c', 
        ctrlKey: true,
        bubbles: true,
        cancelable: true
      });
      
      // Dispatch event to document (where the listener is attached)
      document.dispatchEvent(event);
      
      // Check if operation was copied to clipboard
      expect(store.getters['clipboard/hasOperationInClipboard']).toBe(true);
      const clipboardContent = store.getters['clipboard/clipboardContent'];
      expect(clipboardContent.type).toBe('operation');
      expect(clipboardContent.data.type).toBe('fire');
    });

    it('should copy selected wave when Ctrl+C is pressed', async () => {
      // Select a wave first
      await store.dispatch('selection/selectWave', { waveIndex: 0 });
      
      // Verify wave is selected
      expect(store.getters['selection/isWaveSelected'](0)).toBe(true);
      
      // Get selection info
      const selectionInfo = store.getters['selection/selectionInfo'];
      expect(selectionInfo).toBeTruthy();
      expect(selectionInfo.type).toBe('wave');
      expect(selectionInfo.wave).toBeTruthy();
      
      // Simulate Ctrl+C keydown event
      const event = new KeyboardEvent('keydown', { 
        key: 'c', 
        ctrlKey: true,
        bubbles: true,
        cancelable: true
      });
      
      // Dispatch event to document
      document.dispatchEvent(event);
      
      // Check if wave was copied to clipboard
      expect(store.getters['clipboard/hasWaveInClipboard']).toBe(true);
      const clipboardContent = store.getters['clipboard/clipboardContent'];
      expect(clipboardContent.type).toBe('wave');
    });

    it('should not copy anything when nothing is selected', async () => {
      // Ensure nothing is selected
      await store.dispatch('selection/clearSelection');
      expect(store.getters['selection/hasSelection']).toBe(false);
      
      // Simulate Ctrl+C keydown event
      const event = new KeyboardEvent('keydown', { 
        key: 'c', 
        ctrlKey: true,
        bubbles: true,
        cancelable: true
      });
      
      document.dispatchEvent(event);
      
      // Check that clipboard is still empty
      expect(store.getters['clipboard/hasClipboardData']).toBe(false);
    });

    it('should prevent default behavior when Ctrl+C is pressed', () => {
      const event = new KeyboardEvent('keydown', { 
        key: 'c', 
        ctrlKey: true,
        bubbles: true,
        cancelable: true
      });
      
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
      
      document.dispatchEvent(event);
      
      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  describe('Escape Key', () => {
    it('should clear selection and clipboard when Escape is pressed', async () => {
      // Setup: select something and copy it
      await store.dispatch('selection/selectOperation', { waveIndex: 0, opIndex: 0 });
      await store.dispatch('clipboard/copyOperation', {
        operation: { type: 'fire', time: '300' },
        waveIndex: 0,
        opIndex: 0
      });
      
      expect(store.getters['selection/hasSelection']).toBe(true);
      expect(store.getters['clipboard/hasClipboardData']).toBe(true);
      
      // Simulate Escape keydown event
      const event = new KeyboardEvent('keydown', { 
        key: 'Escape',
        bubbles: true,
        cancelable: true
      });
      
      document.dispatchEvent(event);
      
      // Check that both selection and clipboard are cleared
      expect(store.getters['selection/hasSelection']).toBe(false);
      expect(store.getters['clipboard/hasClipboardData']).toBe(false);
    });
  });
});