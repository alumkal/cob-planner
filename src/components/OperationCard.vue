<template>
  <div 
    class="operation-card"
    :class="[operationClass, { 'dark-theme': theme === 'dark', 'selected': isSelected }]"
    @mouseover="handleMouseOver"
    @mouseout="handleMouseOut"
    @contextmenu="handleRightClick"
    @click.stop="$emit('click', waveIndex, opIndex, $event)"
  >
    <!-- Time Input with Delete Button -->
    <div class="operation-row">
      <span class="row-label">时间:</span>
      <input
        type="text"
        class="form-control form-control-sm flex-grow-1"
        :class="{ 'is-invalid': getValidationError('time') }"
        v-model="localOperation.time"
        @change="handleOperationUpdate"
        @click.stop
        placeholder="300, w-200"
        :title="getValidationError('time') || ''"
      />
      <button
        class="btn btn-sm btn-danger delete-btn"
        @click.stop="handleRemoveOperation"
        title="删除操作"
      >
        ×
      </button>
    </div>

    <!-- Operation Type and Columns on same line -->
    <div class="operation-row">
      <select
        class="form-select form-select-sm operation-type-select"
        v-model="localOperation.type"
        @change="handleOperationUpdate"
        @click.stop
      >
        <option value="fire">发射</option>
        <option value="plant">种炮</option>
        <option value="remove">铲炮</option>
      </select>
      <input
        v-if="localOperation.type === 'fire'"
        type="text"
        class="form-control form-control-sm flex-grow-1"
        :class="{ 'is-invalid': getValidationError('columns') }"
        v-model="localOperation.columns"
        placeholder="1-5 7"
        @change="handleOperationUpdate"
        @click.stop
        :title="getValidationError('columns') || ''"
      />
      <div v-else class="flex-grow-1"></div>
    </div>

    <!-- Position Inputs -->
    <div class="operation-row">
      <input
        type="number"
        class="form-control form-control-sm"
        :class="{ 'is-invalid': getValidationError('row') }"
        v-model.number="localOperation.row"
        min="1"
        :max="maxRows"
        @change="handleOperationUpdate"
        @click.stop
        placeholder="行"
        :title="getValidationError('row') || ''"
      />
      <input
        type="number"
        class="form-control form-control-sm"
        :class="{ 'is-invalid': getValidationError('targetCol') }"
        v-model.number="localOperation.targetCol"
        :min="localOperation.type === 'fire' ? 0 : 1"
        :max="localOperation.type === 'fire' ? 9.9875 : 8"
        :step="localOperation.type === 'fire' ? 0.0125 : 1"
        @change="handleOperationUpdate"
        @click.stop
        :placeholder="localOperation.type === 'fire' ? '目标列' : '列'"
        :title="getValidationError('targetCol') || ''"
      />
    </div>
  </div>
</template>

<script>
import { validateOperation } from '../utils/validation.js';

export default {
  name: 'OperationCard',
  props: {
    operation: {
      type: Object,
      required: true
    },
    waveIndex: {
      type: Number,
      required: true
    },
    opIndex: {
      type: Number,
      required: true
    },
    theme: {
      type: String,
      default: 'light'
    },
    maxRows: {
      type: Number,
      default: 5
    },
    operationClass: {
      type: String,
      default: ''
    },
    validationErrors: {
      type: Map,
      default: () => new Map()
    },
    cannons: {
      type: Array,
      default: () => []
    },
    waves: {
      type: Array,
      default: () => []
    },
    isSelected: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      localOperation: { ...this.operation }
    };
  },
  watch: {
    operation: {
      handler(newOperation) {
        this.localOperation = { ...newOperation };
      },
      deep: true
    }
  },
  methods: {
    getValidationError(field) {
      const key = `${this.waveIndex}-${this.opIndex}-${field}`;
      return this.validationErrors.get(key) || null;
    },
    
    handleOperationUpdate() {
      // Validate the operation
      const errors = validateOperation(
        this.localOperation,
        this.waveIndex,
        this.opIndex,
        this.maxRows,
        this.cannons,
        this.waves
      );
      
      // Emit validation errors
      Object.keys(errors).forEach(field => {
        this.$emit('validation-error', {
          waveIndex: this.waveIndex,
          opIndex: this.opIndex,
          field,
          error: errors[field]
        });
      });
      
      // Clear errors that are no longer present
      const fieldsToCheck = ['time', 'row', 'targetCol', 'columns'];
      fieldsToCheck.forEach(field => {
        if (!errors[field]) {
          this.$emit('validation-error', {
            waveIndex: this.waveIndex,
            opIndex: this.opIndex,
            field,
            error: null
          });
        }
      });
      
      // Emit the update
      this.$emit('update-operation', {
        waveIndex: this.waveIndex,
        opIndex: this.opIndex,
        operation: this.localOperation
      });
    },
    
    handleRemoveOperation() {
      this.$emit('remove-operation', {
        waveIndex: this.waveIndex,
        opIndex: this.opIndex
      });
    },
    
    handleMouseOver() {
      this.$emit('highlight-operation', {
        waveIndex: this.waveIndex,
        opIndex: this.opIndex
      });
    },
    
    handleMouseOut() {
      this.$emit('clear-highlight');
    },
    
    handleRightClick(event) {
      // Check if right-click is on an input field
      const target = event.target;
      const isInputField = target && (
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.tagName === 'SELECT' ||
        target.isContentEditable
      );
      
      // Don't prevent default context menu for input fields
      if (isInputField) {
        return;
      }
      
      event.preventDefault();
      this.$emit('context-menu', {
        event,
        type: 'operation',
        operation: this.localOperation,
        waveIndex: this.waveIndex,
        opIndex: this.opIndex
      });
    }
  }
}
</script>

<style scoped>
.operation-card {
  flex: 0 0 190px;
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  padding: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
  cursor: pointer;
}

.operation-card:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.operation-card.dark-theme {
  background: #343a40;
  border-color: #495057;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.operation-card.dark-theme:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.operation-card.success-bg {
  background-color: rgba(25, 135, 84, 0.1) !important;
  border-color: rgba(25, 135, 84, 0.3) !important;
}

.operation-card.error-bg {
  background-color: rgba(220, 53, 69, 0.1) !important;
  border-color: rgba(220, 53, 69, 0.3) !important;
}

.operation-card.dark-theme.success-bg {
  background-color: rgba(25, 135, 84, 0.2) !important;
  border-color: rgba(25, 135, 84, 0.4) !important;
}

.operation-card.dark-theme.error-bg {
  background-color: rgba(220, 53, 69, 0.2) !important;
  border-color: rgba(220, 53, 69, 0.4) !important;
}

/* Selection styles */
.operation-card.selected {
  background-color: rgba(0, 123, 255, 0.1) !important;
  border-color: rgba(0, 123, 255, 0.5) !important;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25) !important;
}

.operation-card.dark-theme.selected {
  background-color: rgba(13, 110, 253, 0.2) !important;
  border-color: rgba(13, 110, 253, 0.6) !important;
  box-shadow: 0 0 0 2px rgba(13, 110, 253, 0.35) !important;
}

.operation-row {
  display: flex;
  gap: 4px;
  align-items: center;
  margin-bottom: 6px;
}

.operation-row:last-child {
  margin-bottom: 0;
}

.row-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: #6c757d;
  min-width: 32px;
  flex-shrink: 0;
  user-select: none;
}

.dark .row-label {
  color: #adb5bd;
}

.operation-type-select {
  width: 75px;
  flex-shrink: 0;
}

.delete-btn {
  padding: 3px;
  line-height: 1;
  font-size: 11px;
  min-width: auto;
  flex-shrink: 0;
}

.flex-grow-1 {
  flex-grow: 1;
  min-width: 0;
}

.operation-row input[type="number"] {
  flex: 1;
  min-width: 0;
}

/* Validation error styles */
.form-control.is-invalid, .form-select.is-invalid {
  border-color: #dc3545;
  background-color: rgba(220, 53, 69, 0.1);
  box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25);
}

.dark .form-control.is-invalid, .dark .form-select.is-invalid {
  border-color: #dc3545;
  background-color: rgba(220, 53, 69, 0.2);
  box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25);
}

.form-control.is-invalid:focus, .form-select.is-invalid:focus {
  border-color: #dc3545;
  box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25);
}

/* Responsive adjustments */
@media (max-width: 1200px) {
  .operation-card {
    flex: 0 0 170px;
  }
}

@media (max-width: 768px) {
  .operation-card {
    flex: 0 0 100%;
    min-width: 0;
    padding: 6px;
  }

  .operation-row {
    margin-bottom: 4px;
  }

  .row-label {
    font-size: 0.7rem;
    min-width: 28px;
  }
}
</style>