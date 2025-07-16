<template>
  <div class="reuse-page">
    <div class="card mb-4">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h5 class="mb-0">复用计算器</h5>
        <button class="btn btn-primary" @click="calculate">计算</button>
      </div>
      <div class="card-body">
        <div v-if="waves.length === 0" class="text-center p-4">
          <p>还未添加任何波次。添加一个波次开始。</p>
          <button class="btn btn-success" @click="addWave">添加波次</button>
        </div>

        <div v-else>
          <div v-for="(wave, waveIndex) in waves" :key="'wave-' + waveIndex" 
               class="wave-container mb-4"
               :class="{ 'wave-selected': isWaveSelected(waveIndex) }">
            <div class="wave-content">
              <!-- Wave Header Component -->
              <WaveHeader
                :wave="wave"
                :wave-index="waveIndex"
                :theme="theme"
                :validation-errors="validationErrors"
                :is-selected="isWaveSelected(waveIndex)"
                @update-wave="handleWaveUpdate"
                @remove-wave="handleRemoveWave"
                @validation-error="handleValidationError"
                @context-menu="showContextMenu"
                @click="handleWaveClick"
              />

              <!-- Operations Grid -->
              <div 
                class="operations-grid"
                @contextmenu="handleGridRightClick($event, waveIndex)"
                @click="handleGridClick($event, waveIndex)"
              >
                <OperationCard
                  v-for="(op, opIndex) in wave.operations"
                  :key="'operation-' + waveIndex + '-' + opIndex"
                  :operation="op"
                  :wave-index="waveIndex"
                  :op-index="opIndex"
                  :theme="theme"
                  :max-rows="rows"
                  :operation-class="getOperationClass(waveIndex, opIndex)"
                  :validation-errors="validationErrors"
                  :cannons="cannons"
                  :waves="waves"
                  :is-selected="isOperationSelected(waveIndex, opIndex)"
                  @update-operation="handleOperationUpdate"
                  @remove-operation="handleRemoveOperation"
                  @validation-error="handleValidationError"
                  @highlight-operation="highlightOperation"
                  @clear-highlight="clearHighlight"
                  @context-menu="showContextMenu"
                  @click="handleOperationClick"
                />

                <!-- Floating Add Operation Button -->
                <div class="add-operation-card">
                  <button
                    class="add-operation-btn-floating"
                    @click="addOperation(waveIndex)"
                    title="添加操作"
                    :class="{ 'dark-theme': theme === 'dark' }"
                  >
                    <span class="add-icon"></span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div 
            class="text-center add-wave-area"
            @contextmenu.prevent="handleEmptyAreaRightClick"
          >
            <button class="btn btn-success" @click="addWave">添加波次</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Results section -->
    <div v-if="calculationResult && calculationResult.successCount > 0" class="card mb-4">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h5 class="mb-0">计算结果</h5>
        <button 
          v-if="calculationResult.successCount === totalOperations"
          class="btn btn-success btn-sm"
          @click="showExportDialog = true"
        >
          导出
        </button>
      </div>
      <div class="card-body">
        <p>
          成功计算了 {{ calculationResult.successCount }} 个操作。
          <span v-if="calculationResult.successCount < totalOperations" class="text-danger">
            {{ totalOperations - calculationResult.successCount }} 个操作无法满足。
          </span>
        </p>

        <!-- Next available cannons -->
        <div v-if="calculationResult.successCount === totalOperations" class="mt-4">
          <h6>下次可用炮位</h6>
          <table class="table table-bordered" :class="theme === 'dark' ? 'table-dark' : ''">
            <thead>
              <tr>
                <th v-for="(cannon, index) in calculationResult.nextAvailable" :key="'next-' + index">
                  {{ cannon.position }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td v-for="(cannon, index) in calculationResult.nextAvailable" :key="'time-' + index">
                  {{ cannon.time }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Tooltip for operation details -->
    <div
      v-if="highlightedOp"
      class="operation-tooltip"
      :style="tooltipStyle"
    >
      <div class="tooltip-content">
        <p><strong>炮位:</strong> {{ highlightedOp.cannonRow }}-{{ highlightedOp.cannonCol }}</p>
        <p v-if="prevOp"><strong>上次使用:</strong> 波次 {{ prevOp.waveIndex + 1 }}, 时间 {{ prevOp.time }}</p>
        <p v-if="nextOp"><strong>下次使用:</strong> 波次 {{ nextOp.waveIndex + 1 }}, 时间 {{ nextOp.time }}</p>
      </div>
    </div>

    <!-- Export Dialog -->
    <ExportDialog
      :isVisible="showExportDialog"
      :calculationResult="calculationResult"
      :waves="waves"
      :theme="theme"
      @close="showExportDialog = false"
    />

    <!-- Context Menu -->
    <ContextMenu
      :visible="contextMenu.visible"
      :x="contextMenu.x"
      :y="contextMenu.y"
      :type="contextMenu.type"
      :operation="contextMenu.operation"
      :wave="contextMenu.wave"
      :wave-index="contextMenu.waveIndex"
      :op-index="contextMenu.opIndex"
      :theme="theme"
      @close="hideContextMenu"
      @duplicate-operation="handleDuplicateOperation"
      @duplicate-wave="handleDuplicateWave"
      @delete-operation="handleRemoveOperation"
      @add-wave="handleAddWave"
    />
  </div>
</template>

<script>
import { solveReuse } from '../utils/solver.js';
import { validateWave, validateOperation } from '../utils/validation.js';
import { useCopyPaste } from '../composables/useCopyPaste.js';
import ExportDialog from './ExportDialog.vue';
import WaveHeader from './WaveHeader.vue';
import OperationCard from './OperationCard.vue';
import ContextMenu from './ContextMenu.vue';

export default {
  name: 'ReusePage',
  components: {
    ExportDialog,
    WaveHeader,
    OperationCard,
    ContextMenu
  },
  setup() {
    const copyPasteComposable = useCopyPaste();
    return {
      copyPasteComposable
    };
  },
  data() {
    return {
      calculationResult: null,
      highlightedOp: null,
      prevOp: null,
      nextOp: null,
      showExportDialog: false,
      tooltipStyle: {
        top: '0px',
        left: '0px',
        display: 'none'
      },
      validationErrors: new Map(),
      contextMenu: {
        visible: false,
        x: 0,
        y: 0,
        type: 'empty',
        operation: null,
        wave: null,
        waveIndex: null,
        opIndex: null
      }
    };
  },
  mounted() {
    // Perform initial validation
    this.validateAllInputs();
    
    // Add click listener to close context menu and handle outside clicks
    document.addEventListener('click', this.handleDocumentClick);
  },
  beforeUnmount() {
    // Remove click listener
    document.removeEventListener('click', this.handleDocumentClick);
  },
  computed: {
    rows() {
      return this.$store.getters['field/rows'];
    },
    cannons() {
      return this.$store.getters['field/cannons'];
    },
    waves() {
      return this.$store.getters['waves/waves'];
    },
    theme() {
      return this.$store.getters['ui/theme'];
    },
    totalOperations() {
      return this.$store.getters['waves/totalOperations'];
    },
    // Selection computed properties
    currentSelection() {
      return this.$store.getters['selection/currentSelection'];
    },
    hasSelection() {
      return this.$store.getters['selection/hasSelection'];
    }
  },
  methods: {
    // Selection helper methods
    isOperationSelected(waveIndex, opIndex) {
      return this.$store.getters['selection/isOperationSelected'](waveIndex, opIndex);
    },
    
    isWaveSelected(waveIndex) {
      return this.$store.getters['selection/isWaveSelected'](waveIndex);
    },
    
    // Click handlers for selection
    handleOperationClick(waveIndex, opIndex, event = null) {
      // Handle case where this might be called with event object as first parameter
      if (typeof waveIndex === 'object') {
        return; // Ignore event-based calls
      }
      
      // Detect Ctrl+click (or Cmd+click on Mac)
      const isCtrlClick = event && (event.ctrlKey || event.metaKey);
      
      this.$store.dispatch('selection/toggleOperationSelection', { 
        waveIndex, 
        opIndex, 
        isCtrlClick 
      });
    },
    
    handleWaveClick(waveIndex, event = null) {
      // Handle case where this might be called with event object as first parameter
      if (typeof waveIndex === 'object') {
        return; // Ignore event-based calls
      }
      
      // Detect Ctrl+click (or Cmd+click on Mac)
      const isCtrlClick = event && (event.ctrlKey || event.metaKey);
      
      this.$store.dispatch('selection/toggleWaveSelection', { 
        waveIndex, 
        isCtrlClick 
      });
    },
    
    handleGridClick(event, waveIndex) {
      // Check if the click target is within an operation card or add button
      const target = event.target;
      const operationCard = target.closest('.operation-card');
      const addButton = target.closest('.add-operation-btn-floating');
      
      // If we clicked on an operation card or add button, don't handle it here
      if (operationCard || addButton) {
        return;
      }
      
      // Click on empty space in grid - select the wave
      this.$store.dispatch('selection/selectWave', { waveIndex });
    },
    
    addWave() {
      this.$store.dispatch('waves/addWave');
    },
    
    handleAddWave(targetWaveIndex = null) {
      if (targetWaveIndex !== null) {
        // Insert wave at specific position (before the target wave)
        const currentWaves = [...this.waves];
        const newWave = {
          duration: 601,
          notes: '',
          operations: []
        };
        currentWaves.splice(targetWaveIndex, 0, newWave);
        this.$store.dispatch('waves/setWaves', currentWaves);
      } else {
        // Add wave at the end (default behavior)
        this.addWave();
      }
    },
    
    handleRemoveWave(waveIndex) {
      // Update selection before removing wave
      this.$store.dispatch('selection/updateSelectionAfterRemoval', { 
        type: 'wave', 
        removedWaveIndex: waveIndex 
      });
      this.$store.dispatch('waves/removeWave', waveIndex);
      this.calculationResult = null;
    },
    
    handleWaveUpdate(payload) {
      // Transform payload format from { waveIndex, wave } to { index, wave }
      this.$store.dispatch('waves/updateWave', {
        index: payload.waveIndex,
        wave: payload.wave
      });
      this.calculationResult = null;
    },
    
    addOperation(waveIndex) {
      const operation = {
        type: 'fire',
        time: '0',
        columns: '1-8',
        row: 1,
        targetCol: 9,
      };

      this.$store.dispatch('waves/addOperation', { waveIndex, operation });
      this.calculationResult = null;
      
      // Validate the new operation
      this.$nextTick(() => {
        const opIndex = this.waves[waveIndex].operations.length - 1;
        this.validateOperationAtIndex(waveIndex, opIndex);
      });
    },
    
    handleRemoveOperation(payload) {
      // Update selection before removing operation
      this.$store.dispatch('selection/updateSelectionAfterRemoval', { 
        type: 'operation', 
        removedWaveIndex: payload.waveIndex,
        removedOpIndex: payload.opIndex 
      });
      this.$store.dispatch('waves/removeOperation', payload);
      this.calculationResult = null;
    },
    
    handleOperationUpdate(payload) {
      this.$store.dispatch('waves/updateOperation', payload);
      this.calculationResult = null;
    },
    
    handleValidationError({ waveIndex, opIndex, field, error }) {
      const key = opIndex !== undefined 
        ? `${waveIndex}-${opIndex}-${field}` 
        : `wave-${waveIndex}-${field}`;
      
      if (error) {
        this.validationErrors.set(key, error);
      } else {
        this.validationErrors.delete(key);
      }
    },
    
    calculate() {
      // Validate all inputs before calculation
      if (!this.validateAllInputs()) {
        alert('输入数据存在错误，请检查标记为红色的输入框');
        return;
      }
      
      // Calculate reuse
      this.calculationResult = solveReuse(this.cannons, this.waves);
    },
    
    getOperationClass(waveIndex, opIndex) {
      if (!this.calculationResult) return '';

      // Find the operation in the result
      const flatIndex = this.getFlatIndex(waveIndex, opIndex);
      const resultOp = this.calculationResult.operations.find(op =>
        op.waveIndex === waveIndex && op.opIndex === opIndex
      );

      if (!resultOp) return '';

      // Only apply to fire operations
      if (resultOp.type !== 'fire') return '';

      // Check if this operation is successful
      if (flatIndex < this.calculationResult.successCount) {
        return 'success-bg';
      } else {
        return 'error-bg';
      }
    },
    
    getFlatIndex(waveIndex, opIndex) {
      let count = 0;
      for (let w = 0; w < this.waves.length; w++) {
        for (let o = 0; o < this.waves[w].operations.length; o++) {
          if (this.waves[w].operations[o].type === 'fire') {
            if (w === waveIndex && o === opIndex) {
              return count;
            }
            count++;
          }
        }
      }
      return -1;
    },
    
    highlightOperation(payload) {
      if (!this.calculationResult) return;

      const { waveIndex, opIndex } = payload;
      const op = this.waves[waveIndex].operations[opIndex];
      if (op.type !== 'fire') return;

      // Find the operation in the result
      const resultOp = this.calculationResult.operations.find(o =>
        o.waveIndex === waveIndex && o.opIndex === opIndex
      );

      if (!resultOp || !resultOp.success) return;

      // Set the highlighted operation
      this.highlightedOp = resultOp;

      // Find previous and next operations using the same cannon
      const cannonRow = resultOp.cannonRow;
      const cannonCol = resultOp.cannonCol;

      this.prevOp = this.calculationResult.operations.filter(o =>
        o.type === 'fire' &&
        o.success &&
        o.cannonRow === cannonRow &&
        o.cannonCol === cannonCol &&
        (o.waveIndex < waveIndex || (o.waveIndex === waveIndex && o.opIndex < opIndex))
      ).pop();

      this.nextOp = this.calculationResult.operations.find(o =>
        o.type === 'fire' &&
        o.success &&
        o.cannonRow === cannonRow &&
        o.cannonCol === cannonCol &&
        (o.waveIndex > waveIndex || (o.waveIndex === waveIndex && o.opIndex > opIndex))
      );

      // Position the tooltip
      const event = window.event;
      if (event) {
        this.tooltipStyle = {
          top: `${event.clientY + 10}px`,
          left: `${event.clientX + 10}px`,
          display: 'block'
        };
      }
    },
    
    clearHighlight() {
      this.highlightedOp = null;
      this.prevOp = null;
      this.nextOp = null;
      this.tooltipStyle.display = 'none';
    },
    
    validateOperationAtIndex(waveIndex, opIndex) {
      const operation = this.waves[waveIndex].operations[opIndex];
      const errors = validateOperation(
        operation,
        waveIndex,
        opIndex,
        this.rows,
        this.cannons,
        this.waves
      );
      
      // Update validation errors
      Object.keys(errors).forEach(field => {
        this.handleValidationError({
          waveIndex,
          opIndex,
          field,
          error: errors[field]
        });
      });
      
      // Clear errors that are no longer present
      const fieldsToCheck = ['time', 'row', 'targetCol', 'columns'];
      fieldsToCheck.forEach(field => {
        if (!errors[field]) {
          this.handleValidationError({
            waveIndex,
            opIndex,
            field,
            error: null
          });
        }
      });
    },
    
    validateWaveAtIndex(waveIndex) {
      const wave = this.waves[waveIndex];
      const errors = validateWave(wave, waveIndex);
      
      Object.keys(errors).forEach(field => {
        this.handleValidationError({
          waveIndex,
          field,
          error: errors[field]
        });
      });
      
      if (!errors.duration) {
        this.handleValidationError({
          waveIndex,
          field: 'duration',
          error: null
        });
      }
    },
    
    validateAllInputs() {
      this.validationErrors.clear();
      
      // Validate all waves
      this.waves.forEach((wave, waveIndex) => {
        this.validateWaveAtIndex(waveIndex);
        
        // Validate all operations in this wave
        wave.operations.forEach((op, opIndex) => {
          this.validateOperationAtIndex(waveIndex, opIndex);
        });
      });
      
      return this.validationErrors.size === 0;
    },
    
    // Context menu methods
    showContextMenu(payload) {
      this.contextMenu = {
        visible: true,
        x: payload.event.clientX,
        y: payload.event.clientY,
        type: payload.type,
        operation: payload.operation || null,
        wave: payload.wave || null,
        waveIndex: payload.waveIndex,
        opIndex: payload.opIndex !== undefined ? payload.opIndex : null
      };
    },
    
    hideContextMenu() {
      this.contextMenu.visible = false;
    },
    
    handleDocumentClick(event) {
      // Close context menu
      this.hideContextMenu();
      
      // Only clear selection if click is outside the reuse page
      const reusePage = event.target.closest('.reuse-page');
      if (!reusePage) {
        this.$store.dispatch('selection/clearSelection');
      }
    },
    
    handleGridRightClick(event, waveIndex) {
      // Check if the click target is the grid itself (empty area) or an operation card or wave header
      const target = event.target;
      const operationCard = target.closest('.operation-card');
      const waveHeader = target.closest('.wave-header');
      
      // If we clicked on an operation card or wave header, don't handle it here
      if (operationCard || waveHeader) {
        return;
      }
      
      // Only handle if the target is within the operations-grid
      const operationsGrid = target.closest('.operations-grid');
      if (!operationsGrid) {
        return;
      }
      
      // Prevent default context menu only for empty area clicks
      event.preventDefault();
      
      this.showContextMenu({
        event,
        type: 'wave',
        wave: this.waves[waveIndex],
        waveIndex: waveIndex
      });
    },
    
    handleEmptyAreaRightClick(event) {
      this.showContextMenu({
        event,
        type: 'wave',
        wave: null,
        waveIndex: null
      });
    },
    
    
    async handleDuplicateOperation(payload) {
      // Duplicate operation is handled by the context menu component
      this.calculationResult = null;
      this.$nextTick(() => {
        const wave = this.waves[payload.waveIndex];
        if (wave && wave.operations.length > 0) {
          const opIndex = wave.operations.length - 1;
          this.validateOperationAtIndex(payload.waveIndex, opIndex);
        }
      });
    },
    
    async handleDuplicateWave(payload) {
      // Duplicate wave is handled by the context menu component
      this.calculationResult = null;
      this.$nextTick(() => {
        const waveIndex = this.waves.length - 1;
        this.validateWaveAtIndex(waveIndex);
        
        // Validate all operations in the new wave
        const wave = this.waves[waveIndex];
        if (wave) {
          wave.operations.forEach((op, opIndex) => {
            this.validateOperationAtIndex(waveIndex, opIndex);
          });
        }
      });
    }
  },
  watch: {
    // Re-validate when cannons change (affects plant/remove validation)
    cannons: {
      handler() {
        this.validateAllInputs();
      },
      deep: true
    },
    // Re-validate when rows change (affects row validation)
    rows() {
      this.validateAllInputs();
    }
  }
}
</script>

<style scoped>
.wave-content {
  position: relative;
}

/* Wave selection styles - highlight header and operations grid without connecting borders */
.wave-container.wave-selected .wave-header {
  background-color: rgba(0, 123, 255, 0.1) !important;
  border-color: rgba(0, 123, 255, 0.5) !important;
  border-bottom-color: #dee2e6 !important; /* Keep original bottom border */
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.5) !important;
  box-shadow: 
    0 -2px 0 0 rgba(0, 123, 255, 0.5), 
    -2px 0 0 0 rgba(0, 123, 255, 0.5), 
    2px 0 0 0 rgba(0, 123, 255, 0.5) !important; /* Only top, left, right borders */
}

.dark .wave-container.wave-selected .wave-header {
  background-color: rgba(13, 110, 253, 0.2) !important;
  border-color: rgba(13, 110, 253, 0.6) !important;
  border-bottom-color: #495057 !important; /* Keep original bottom border for dark theme */
  box-shadow: 
    0 -2px 0 0 rgba(13, 110, 253, 0.6), 
    -2px 0 0 0 rgba(13, 110, 253, 0.6), 
    2px 0 0 0 rgba(13, 110, 253, 0.6) !important; /* Only top, left, right borders */
}

.wave-container.wave-selected .operations-grid {
  background-color: rgba(0, 123, 255, 0.1) !important;
  border-color: rgba(0, 123, 255, 0.5) !important;
  border-top-color: #dee2e6 !important; /* Keep original top border */
  box-shadow: 
    0 2px 0 0 rgba(0, 123, 255, 0.5), 
    -2px 0 0 0 rgba(0, 123, 255, 0.5), 
    2px 0 0 0 rgba(0, 123, 255, 0.5) !important; /* Only bottom, left, right borders */
}

.dark .wave-container.wave-selected .operations-grid {
  background-color: rgba(13, 110, 253, 0.2) !important;
  border-color: rgba(13, 110, 253, 0.6) !important;
  border-top-color: #495057 !important; /* Keep original top border for dark theme */
  box-shadow: 
    0 2px 0 0 rgba(13, 110, 253, 0.6), 
    -2px 0 0 0 rgba(13, 110, 253, 0.6), 
    2px 0 0 0 rgba(13, 110, 253, 0.6) !important; /* Only bottom, left, right borders */
}

.operation-tooltip {
  position: fixed;
  z-index: 1000;
  background-color: white;
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  max-width: 300px;
}

.dark .operation-tooltip {
  background-color: #343a40;
  border-color: #495057;
  color: white;
}

.tooltip-content p {
  margin-bottom: 5px;
}

.tooltip-content p:last-child {
  margin-bottom: 0;
}

/* Operations Grid Styling */
.operations-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding: 12px;
  background-color: rgba(0, 0, 0, 0.01);
  border: 1px solid #dee2e6;
  border-top: none;
  border-radius: 0 0 8px 8px;
  min-height: 90px;
  align-items: stretch;
  cursor: pointer;
}

.dark .operations-grid {
  background-color: rgba(255, 255, 255, 0.01);
  border-color: #495057;
}

/* Add Operation Card */
.add-operation-card {
  flex: 0 0 50px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Floating Add Operation Button */
.add-operation-btn-floating {
  width: 40px;
  height: 40px;
  border: 2px dashed #6c757d;
  background: rgba(108, 117, 125, 0.05);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  padding: 0;
}

.add-operation-btn-floating:hover {
  border-color: #198754;
  background: rgba(25, 135, 84, 0.05);
  transform: scale(1.05);
}

.add-operation-btn-floating:active {
  transform: scale(0.95);
}

.add-operation-btn-floating.dark-theme {
  border-color: #adb5bd;
  background: rgba(173, 181, 189, 0.05);
}

.add-operation-btn-floating.dark-theme:hover {
  border-color: #20c997;
  background: rgba(32, 201, 151, 0.05);
}

.add-icon {
  position: relative;
  display: block;
  width: 24px;
  height: 24px;
}

.add-icon::before,
.add-icon::after {
  content: '';
  position: absolute;
  background: #6c757d;
  border-radius: 1px;
  transition: all 0.2s ease;
}

.add-icon::before {
  width: 24px;
  height: 2px;
  top: 50%;
  left: 0;
  transform: translateY(-50%);
}

.add-icon::after {
  width: 2px;
  height: 24px;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
}

.add-operation-btn-floating:hover .add-icon::before,
.add-operation-btn-floating:hover .add-icon::after {
  background: #198754;
}

.add-operation-btn-floating.dark-theme .add-icon::before,
.add-operation-btn-floating.dark-theme .add-icon::after {
  background: #adb5bd;
}

.add-operation-btn-floating.dark-theme:hover .add-icon::before,
.add-operation-btn-floating.dark-theme:hover .add-icon::after {
  background: #20c997;
}

.add-operation-btn-floating:focus {
  outline: none;
}

.add-operation-btn-floating:focus .add-icon::before,
.add-operation-btn-floating:focus .add-icon::after {
  background: #198754;
  box-shadow: 0 0 4px rgba(25, 135, 84, 0.5);
}

.add-operation-btn-floating.dark-theme:focus .add-icon::before,
.add-operation-btn-floating.dark-theme:focus .add-icon::after {
  background: #20c997;
  box-shadow: 0 0 4px rgba(32, 201, 151, 0.5);
}

/* Add Wave Area */
.add-wave-area {
  padding: 20px;
  margin: 16px 0;
  border-radius: 8px;
  transition: background-color 0.2s ease;
}

.add-wave-area:hover {
  background-color: rgba(0, 123, 255, 0.05);
}

.dark .add-wave-area:hover {
  background-color: rgba(255, 255, 255, 0.05);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .operations-grid {
    gap: 12px;
    padding: 12px;
  }

  .add-operation-card {
    flex: 0 0 100%;
    min-height: 50px;
  }

  .add-operation-btn-floating {
    width: 100%;
    height: 50px;
  }

  .add-icon {
    width: 20px;
    height: 20px;
  }

  .add-icon::before {
    width: 20px;
    height: 2px;
  }

  .add-icon::after {
    width: 2px;
    height: 20px;
  }
}
</style>