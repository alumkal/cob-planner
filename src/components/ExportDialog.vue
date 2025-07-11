<template>
  <div v-if="isVisible" class="modal-backdrop" @click="handleBackdropClick">
    <div class="modal-dialog" @click.stop>
      <div class="modal-content" :class="{ 'dark-theme': theme === 'dark' }">
        <div class="modal-header">
          <h5 class="modal-title">导出复用代码</h5>
          <button type="button" class="close-btn" @click="close">
            <span>&times;</span>
          </button>
        </div>
        
        <div class="modal-body">
          <div class="format-selector mb-3">
            <label class="form-label">导出格式:</label>
            <select 
              v-model="selectedFormat" 
              class="form-select"
              :class="{ 'dark-theme': theme === 'dark' }"
            >
              <option value="avz2">AvZ2 DSL</option>
            </select>
          </div>
          
          <div class="code-container">
            <label class="form-label">生成的代码:</label>
            <textarea
              ref="codeTextarea"
              v-model="generatedCode"
              class="code-textarea"
              :class="{ 'dark-theme': theme === 'dark' }"
              readonly
              rows="20"
            ></textarea>
          </div>
        </div>
        
        <div class="modal-footer">
          <button 
            type="button" 
            class="btn btn-secondary" 
            @click="close"
          >
            取消
          </button>
          <button 
            type="button" 
            class="btn btn-primary" 
            @click="copyToClipboard"
            :disabled="!generatedCode"
          >
            {{ copyButtonText }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { generateAvZ2Code } from '../utils/avz2Export.js';

export default {
  name: 'ExportDialog',
  props: {
    isVisible: {
      type: Boolean,
      default: false
    },
    calculationResult: {
      type: Object,
      default: null
    },
    waves: {
      type: Array,
      default: () => []
    },
    theme: {
      type: String,
      default: 'light'
    }
  },
  data() {
    return {
      selectedFormat: 'avz2',
      copyButtonText: '复制到剪贴板',
      copyTimeout: null
    };
  },
  computed: {
    generatedCode() {
      if (!this.calculationResult || !this.waves.length) {
        return '';
      }
      
      switch (this.selectedFormat) {
        case 'avz2':
          return generateAvZ2Code(this.calculationResult, this.waves);
        default:
          return '';
      }
    }
  },
  watch: {
    isVisible(newValue) {
      if (newValue) {
        // Reset copy button text when dialog opens
        this.copyButtonText = '复制到剪贴板';
        if (this.copyTimeout) {
          clearTimeout(this.copyTimeout);
          this.copyTimeout = null;
        }
      }
    }
  },
  methods: {
    close() {
      this.$emit('close');
    },
    
    handleBackdropClick() {
      this.close();
    },
    
    async copyToClipboard() {
      if (!this.generatedCode) return;
      
      try {
        await navigator.clipboard.writeText(this.generatedCode);
        this.copyButtonText = '已复制!';
        
        // Reset button text after 2 seconds
        if (this.copyTimeout) {
          clearTimeout(this.copyTimeout);
        }
        this.copyTimeout = setTimeout(() => {
          this.copyButtonText = '复制到剪贴板';
        }, 2000);
      } catch (err) {
        // Fallback for older browsers
        this.fallbackCopyToClipboard();
      }
    },
    
    fallbackCopyToClipboard() {
      const textarea = this.$refs.codeTextarea;
      if (textarea) {
        textarea.select();
        textarea.setSelectionRange(0, 99999); // For mobile devices
        
        try {
          document.execCommand('copy');
          this.copyButtonText = '已复制!';
          
          if (this.copyTimeout) {
            clearTimeout(this.copyTimeout);
          }
          this.copyTimeout = setTimeout(() => {
            this.copyButtonText = '复制到剪贴板';
          }, 2000);
        } catch (err) {
          console.error('Failed to copy to clipboard:', err);
        }
      }
    }
  },
  
  beforeUnmount() {
    if (this.copyTimeout) {
      clearTimeout(this.copyTimeout);
    }
  }
};
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1050;
}

.modal-dialog {
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.modal-content {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  max-height: 90vh;
}

.modal-content.dark-theme {
  background: #343a40;
  color: white;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #dee2e6;
}

.dark-theme .modal-header {
  border-bottom-color: #495057;
}

.modal-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.close-btn:hover {
  background-color: rgba(0, 0, 0, 0.1);
}

.dark-theme .close-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.modal-body {
  padding: 20px;
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.format-selector {
  margin-bottom: 16px;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  font-size: 0.9rem;
}

.form-select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  background-color: white;
}

.form-select.dark-theme {
  background-color: #495057;
  border-color: #6c757d;
  color: white;
}

.code-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.code-textarea {
  flex: 1;
  width: 100%;
  padding: 12px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.4;
  resize: none;
  background-color: #f8f9fa;
  min-height: 400px;
}

.code-textarea.dark-theme {
  background-color: #2d3748;
  border-color: #4a5568;
  color: #e2e8f0;
}

.code-textarea:focus {
  outline: none;
  border-color: #80bdff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 20px;
  border-top: 1px solid #dee2e6;
}

.dark-theme .modal-footer {
  border-top-color: #495057;
}

.btn {
  padding: 8px 16px;
  border: 1px solid transparent;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.btn-secondary {
  background-color: #6c757d;
  border-color: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background-color: #5a6268;
  border-color: #545b62;
}

.btn-primary {
  background-color: #007bff;
  border-color: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #0056b3;
  border-color: #004085;
}

.btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .modal-dialog {
    width: 95%;
    max-height: 95vh;
  }
  
  .modal-header,
  .modal-body,
  .modal-footer {
    padding: 12px 16px;
  }
  
  .code-textarea {
    min-height: 300px;
    font-size: 12px;
  }
}
</style>