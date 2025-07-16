<template>
  <div
    v-if="visible"
    class="context-menu"
    :style="{ top: y + 'px', left: x + 'px' }"
    @contextmenu.prevent
  >
    <div class="context-menu-content" :class="{ 'dark-theme': theme === 'dark' }">
      <!-- Operation Context Menu -->
      <template v-if="type === 'operation'">
        <button 
          class="context-menu-item"
          @click="copyOperation"
          :disabled="!operation"
        >
          📋 复制操作
        </button>
        <button 
          class="context-menu-item"
          @click="pasteOperation"
          v-if="hasOperationInClipboard"
        >
          📄 粘贴操作
        </button>
        <div class="context-menu-divider" v-if="hasOperationInClipboard"></div>
        <button 
          class="context-menu-item"
          @click="duplicateOperation"
          :disabled="!operation"
        >
          🔄 复制并粘贴
        </button>
        <div class="context-menu-divider"></div>
        <button 
          class="context-menu-item danger"
          @click="deleteOperation"
          :disabled="!operation"
        >
          🗑️ 删除操作
        </button>
      </template>

      <!-- Wave Context Menu -->
      <template v-if="type === 'wave'">
        <button 
          class="context-menu-item"
          @click="copyWave"
          v-if="wave"
        >
          📋 复制波次
        </button>
        <button 
          class="context-menu-item"
          @click="pasteOperation"
          v-if="hasOperationInClipboard"
        >
          📄 粘贴操作
        </button>
        <button 
          class="context-menu-item"
          @click="pasteWave"
          v-if="hasWaveInClipboard"
        >
          📄 粘贴波次
        </button>
        <div class="context-menu-divider" v-if="hasClipboardData"></div>
        <button 
          class="context-menu-item"
          @click="duplicateWave"
          v-if="wave"
        >
          🔄 克隆波次
        </button>
        <button 
          class="context-menu-item"
          @click="addWave"
        >
          ➕ 添加波次
        </button>
      </template>
    </div>
  </div>
</template>

<script>
import { useCopyPaste } from '../composables/useCopyPaste.js';

export default {
  name: 'ContextMenu',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    x: {
      type: Number,
      default: 0
    },
    y: {
      type: Number,
      default: 0
    },
    type: {
      type: String,
      default: 'wave', // 'operation' | 'wave'
      validator: value => ['operation', 'wave'].includes(value)
    },
    operation: {
      type: Object,
      default: null
    },
    wave: {
      type: Object,
      default: null
    },
    waveIndex: {
      type: Number,
      default: null
    },
    opIndex: {
      type: Number,
      default: null
    },
    theme: {
      type: String,
      default: 'light'
    }
  },
  setup() {
    const copyPasteComposable = useCopyPaste(false); // Disable keyboard shortcuts in context menu
    return {
      copyPasteComposable
    };
  },
  computed: {
    hasOperationInClipboard() {
      // Access the store directly to ensure reactivity
      return this.$store.getters['clipboard/hasOperationInClipboard'];
    },
    hasWaveInClipboard() {
      // Access the store directly to ensure reactivity
      return this.$store.getters['clipboard/hasWaveInClipboard'];
    },
    hasClipboardData() {
      // Access the store directly to ensure reactivity
      return this.$store.getters['clipboard/hasClipboardData'];
    }
  },
  methods: {
    // Operation actions
    copyOperation() {
      if (!this.operation) return;
      this.copyPasteComposable.copyOperation(this.operation, this.waveIndex, this.opIndex);
      this.$emit('close');
    },
    
    async pasteOperation() {
      // Use the copy-paste composable's paste shortcut handler for consistency
      // Pass the wave index from context menu
      await this.copyPasteComposable.handlePasteShortcut(this.waveIndex);
      this.$emit('close');
    },
    
    async duplicateOperation() {
      if (!this.operation) return;
      const success = await this.copyPasteComposable.duplicateOperation(this.operation, this.waveIndex, this.opIndex);
      if (success) {
        this.$emit('duplicate-operation', { waveIndex: this.waveIndex, opIndex: this.opIndex });
      }
      this.$emit('close');
    },
    
    deleteOperation() {
      if (this.operation) {
        this.$emit('delete-operation', { waveIndex: this.waveIndex, opIndex: this.opIndex });
      }
      this.$emit('close');
    },
    
    // Wave actions
    copyWave() {
      if (!this.wave) return;
      this.copyPasteComposable.copyWave(this.wave, this.waveIndex);
      this.$emit('close');
    },
    
    async pasteWave() {
      // Use the copy-paste composable's paste shortcut handler for consistency
      // For waves, don't pass target index to default to appending at the end
      await this.copyPasteComposable.handlePasteShortcut();
      this.$emit('close');
    },
    
    async duplicateWave() {
      if (!this.wave) return;
      const success = await this.copyPasteComposable.duplicateWave(this.wave, this.waveIndex);
      if (success) {
        this.$emit('duplicate-wave', { waveIndex: this.waveIndex });
      }
      this.$emit('close');
    },
    
    
    
    
    addWave() {
      // Pass wave index if available (for inserting before current wave)
      if (this.waveIndex !== null) {
        this.$emit('add-wave', this.waveIndex);
      } else {
        this.$emit('add-wave');
      }
      this.$emit('close');
    }
  }
}
</script>

<style scoped>
.context-menu {
  position: fixed;
  z-index: 9999;
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 4px 0;
  min-width: 160px;
  user-select: none;
}

.context-menu-content.dark-theme {
  background: #343a40;
  border-color: #495057;
  color: white;
}

.context-menu-item {
  width: 100%;
  padding: 8px 16px;
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: inherit;
  transition: background-color 0.2s ease;
}

.context-menu-item:hover:not(:disabled) {
  background-color: rgba(0, 123, 255, 0.1);
}

.dark-theme .context-menu-item:hover:not(:disabled) {
  background-color: rgba(255, 255, 255, 0.1);
}

.context-menu-item:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.context-menu-item.danger {
  color: #dc3545;
}

.context-menu-item.danger:hover:not(:disabled) {
  background-color: rgba(220, 53, 69, 0.1);
  color: #dc3545;
}

.context-menu-divider {
  height: 1px;
  background-color: #dee2e6;
  margin: 4px 0;
}

.dark-theme .context-menu-divider {
  background-color: #495057;
}

/* Animation */
.context-menu {
  animation: contextMenuAppear 0.2s ease-out;
}

@keyframes contextMenuAppear {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>