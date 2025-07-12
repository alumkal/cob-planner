<template>
  <div class="field-page">
    <div class="card mb-4">
      <div class="card-header">
        <h5 class="mb-3">布阵设置</h5>
        <div class="d-flex flex-wrap gap-3 align-items-center">
          <div class="d-flex align-items-center">
            <label for="fieldNameInput" class="me-2">名称:</label>
            <input
              type="text"
              id="fieldNameInput"
              class="form-control form-control-sm"
              style="width: 200px"
              v-model="fieldNameInput"
              @input="updateFieldName"
              placeholder="输入阵型名称"
            />
          </div>
          <div class="d-flex align-items-center">
            <label for="rowsInput" class="me-2">行数:</label>
            <input
              type="number"
              id="rowsInput"
              class="form-control form-control-sm"
              style="width: 70px"
              v-model.number="rowsInput"
              min="1"
              max="10"
              @change="updateRows"
            />
          </div>
        </div>
      </div>
      <div class="card-body">
        <div class="field-container">
          <div class="field-grid" :style="{ gridTemplateRows: `repeat(${rows}, 80px)` }">
            <div
              v-for="row in rows"
              :key="'row-' + row"
              class="field-row"
            >
              <div
                v-for="col in 9"
                :key="'cell-' + row + '-' + col"
                class="field-cell"
                :class="{ 'has-cannon': hasCannon(row, col) }"
                @click="toggleCannon(row, col)"
              >
                {{ row }}-{{ col }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script>
export default {
  name: 'FieldPage',
  data() {
    return {
      rowsInput: 5,
      fieldNameInput: ''
    };
  },
  computed: {
    rows() {
      return this.$store.getters['field/rows'];
    },
    cannons() {
      return this.$store.getters['field/cannons'];
    },
    theme() {
      return this.$store.getters['ui/theme'];
    },
    fieldName() {
      return this.$store.getters['field/fieldName'];
    }
  },
  mounted() {
    this.rowsInput = this.rows;
    this.fieldNameInput = this.fieldName;
  },
  methods: {
    updateRows() {
      this.$store.dispatch('field/setRows', this.rowsInput);
      this.rowsInput = this.rows; // Update to the validated value
    },
    hasCannon(row, col) {
      return this.$store.getters['field/hasCannonAt'](row, col);
    },
    toggleCannon(row, col) {
      this.$store.dispatch('field/toggleCannon', { row, col });
    },
    addCannon(row, col) {
      this.$store.dispatch('field/addCannon', { row, col });
    },
    removeCannon(row, col) {
      this.$store.dispatch('field/removeCannon', { row, col });
    },
    updateFieldName() {
      this.$store.dispatch('field/setFieldName', this.fieldNameInput);
    }
  }
}
</script>

<style scoped>
.field-container {
  overflow-x: auto;
  padding: 10px;
}

.field-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 5px;
}

.field-row {
  display: grid;
  grid-template-columns: repeat(9, 80px);
  gap: 5px;
}

.field-cell {
  height: 80px;
  border: 1px solid var(--light-border);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s;
  background-color: rgba(0, 0, 0, 0.05);
}

.dark .field-cell {
  border-color: var(--dark-border);
  background-color: rgba(255, 255, 255, 0.05);
}

.field-cell:hover {
  background-color: rgba(13, 110, 253, 0.1);
}

.field-cell.has-cannon {
  background-color: rgba(25, 135, 84, 0.3);
}

.field-cell.has-cannon:hover {
  background-color: rgba(25, 135, 84, 0.5);
}

.dark .field-cell.has-cannon {
  background-color: rgba(25, 135, 84, 0.5);
}

.dark .field-cell.has-cannon:hover {
  background-color: rgba(25, 135, 84, 0.7);
}
</style>