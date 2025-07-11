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
              <!-- Wave Header -->
              <div class="wave-header" :class="theme === 'dark' ? 'dark-theme' : ''">
                <div class="wave-info">
                  <h6 class="wave-title">波次 {{ waveIndex + 1 }}</h6>
                  <div class="wave-duration">
                    <label>波长:</label>
                    <input
                      type="number"
                      class="form-control form-control-sm"
                      v-model.number="wave.duration"
                      min="1"
                      @change="updateWave(waveIndex)"
                    />
                  </div>
                </div>
                <button class="btn btn-sm btn-danger" @click="removeWave(waveIndex)">
                  移除波次
                </button>
              </div>

              <!-- Operations Grid -->
              <div class="operations-grid">
                <div
                  v-for="(op, opIndex) in wave.operations"
                  :key="'operation-' + waveIndex + '-' + opIndex"
                  class="operation-card"
                  :class="[getOperationClass(waveIndex, opIndex), { 'dark-theme': theme === 'dark' }]"
                  @mouseover="highlightOperation(waveIndex, opIndex)"
                  @mouseout="clearHighlight"
                >
                  <!-- Time Input with Delete Button -->
                  <div class="operation-row">
                    <span class="row-label">时间:</span>
                    <input
                      type="text"
                      class="form-control form-control-sm flex-grow-1"
                      v-model="op.time"
                      @change="updateOperation(waveIndex, opIndex)"
                      placeholder="300, w-200"
                    />
                    <button
                      class="btn btn-sm btn-danger delete-btn"
                      @click="removeOperation(waveIndex, opIndex)"
                      title="删除操作"
                    >
                      ×
                    </button>
                  </div>

                  <!-- Operation Type and Columns on same line -->
                  <div class="operation-row">
                    <select
                      class="form-select form-select-sm operation-type-select"
                      v-model="op.type"
                      @change="updateOperation(waveIndex, opIndex)"
                    >
                      <option value="fire">发射</option>
                      <option value="plant">种炮</option>
                      <option value="remove">铲炮</option>
                    </select>
                    <input
                      v-if="op.type === 'fire'"
                      type="text"
                      class="form-control form-control-sm flex-grow-1"
                      v-model="op.columns"
                      placeholder="1-5 7"
                      @change="updateOperation(waveIndex, opIndex)"
                    />
                    <div v-else class="flex-grow-1"></div>
                  </div>

                  <!-- Position Inputs -->
                  <div class="operation-row">
                    <input
                      type="number"
                      class="form-control form-control-sm"
                      v-model.number="op.row"
                      min="1"
                      :max="rows"
                      @change="updateOperation(waveIndex, opIndex)"
                      placeholder="行"
                    />
                    <input
                      type="number"
                      class="form-control form-control-sm"
                      v-model.number="op.targetCol"
                      :min="op.type === 'fire' ? 0 : 1"
                      :max="op.type === 'fire' ? 9.9875 : 8"
                      :step="op.type === 'fire' ? 0.0001 : 1"
                      @change="updateOperation(waveIndex, opIndex)"
                      :placeholder="op.type === 'fire' ? '目标列' : '列'"
                    />
                  </div>
                </div>

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
import ExportDialog from './ExportDialog.vue';

export default {
  name: 'ReusePage',
  components: {
    ExportDialog
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
      }
    };
  },
  computed: {
    rows() {
      return this.$store.state.rows;
    },
    cannons() {
      return this.$store.state.cannons;
    },
    waves() {
      return this.$store.state.waves;
    },
    theme() {
      return this.$store.state.theme;
    },
    totalOperations() {
      return this.waves.reduce((total, wave) => {
        return total + wave.operations.filter(op => op.type === 'fire').length;
      }, 0);
    }
  },
  methods: {
    addWave() {
      this.$store.commit('addWave');
    },
    removeWave(index) {
      this.$store.commit('removeWave', index);
      this.calculationResult = null;
    },
    updateWave(index) {
      this.$store.commit('updateWave', {
        index,
        wave: this.waves[index]
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

      this.$store.commit('addOperation', { waveIndex, operation });
      this.calculationResult = null;
    },
    removeOperation(waveIndex, opIndex) {
      this.$store.commit('removeOperation', { waveIndex, opIndex });
      this.calculationResult = null;
    },
    updateOperation(waveIndex, opIndex) {
      this.$store.commit('updateOperation', {
        waveIndex,
        opIndex,
        operation: this.waves[waveIndex].operations[opIndex]
      });
      this.calculationResult = null;
    },
    calculate() {
      // Flatten all operations
      const allOperations = [];
      this.waves.forEach((wave, waveIndex) => {
        wave.operations.forEach((op, opIndex) => {
          allOperations.push({
            ...op,
            waveIndex,
            opIndex
          });
        });
      });

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
    highlightOperation(waveIndex, opIndex) {
      if (!this.calculationResult) return;

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

/* Wave Header Styling */
.wave-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: rgba(0, 0, 0, 0.02);
  border: 1px solid #dee2e6;
  border-radius: 8px 8px 0 0;
  margin-bottom: 0;
}

.wave-header.dark-theme {
  background-color: rgba(255, 255, 255, 0.02);
  border-color: #495057;
}

.wave-info {
  display: flex;
  align-items: center;
  gap: 20px;
}

.wave-title {
  margin: 0;
  font-weight: 600;
  color: #495057;
}

.dark .wave-title {
  color: #adb5bd;
}

.wave-duration {
  display: flex;
  align-items: center;
  gap: 8px;
}

.wave-duration label {
  font-size: 0.875rem;
  font-weight: 500;
  margin: 0;
  white-space: nowrap;
}

.wave-duration input {
  width: 80px;
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

/* Operation Card Styling */
.operation-card {
  flex: 0 0 190px;
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  padding: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
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

/* Operation Row Styling */
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
@media (max-width: 1200px) {
  .operation-card {
    flex: 0 0 170px;
  }
}

@media (max-width: 768px) {
  .wave-header {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
    padding: 12px;
  }

  .wave-info {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .wave-duration {
    justify-content: space-between;
  }

  .operations-grid {
    gap: 12px;
    padding: 12px;
  }

  .operation-card {
    flex: 0 0 100%;
    min-width: 0;
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

@media (max-width: 480px) {
  .operation-card {
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
