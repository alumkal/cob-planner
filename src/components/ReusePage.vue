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
          <div v-for="(wave, waveIndex) in waves" :key="'wave-' + waveIndex" class="wave-container mb-4">
            <div class="wave-content">
              <!-- Wave Header Component -->
              <WaveHeader
                :wave="wave"
                :wave-index="waveIndex"
                :theme="theme"
                :validation-errors="validationErrors"
                @update-wave="handleWaveUpdate"
                @remove-wave="handleRemoveWave"
                @validation-error="handleValidationError"
              />

              <!-- Operations Grid -->
              <div class="operations-grid">
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
                  @update-operation="handleOperationUpdate"
                  @remove-operation="handleRemoveOperation"
                  @validation-error="handleValidationError"
                  @highlight-operation="highlightOperation"
                  @clear-highlight="clearHighlight"
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

          <div class="text-center">
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
  </div>
</template>

<script>
import { solveReuse } from '../utils/solver.js';
import { validateWave, validateOperation } from '../utils/validation.js';
import ExportDialog from './ExportDialog.vue';
import WaveHeader from './WaveHeader.vue';
import OperationCard from './OperationCard.vue';

export default {
  name: 'ReusePage',
  components: {
    ExportDialog,
    WaveHeader,
    OperationCard
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
      validationErrors: new Map()
    };
  },
  mounted() {
    // Perform initial validation
    this.validateAllInputs();
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
    }
  },
  methods: {
    addWave() {
      this.$store.dispatch('waves/addWave');
    },
    
    handleRemoveWave(waveIndex) {
      this.$store.dispatch('waves/removeWave', waveIndex);
      this.calculationResult = null;
    },
    
    handleWaveUpdate(payload) {
      this.$store.dispatch('waves/updateWave', payload);
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
  align-items: flex-start;
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
  min-height: 90px;
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