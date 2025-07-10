<template>
  <div class="field-page">
    <div class="card mb-4">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h5 class="mb-0">布阵设置</h5>
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
    
    <div class="card">
      <div class="card-header">
        <h5 class="mb-0">炮位列表</h5>
      </div>
      <div class="card-body">
        <table class="table" :class="theme === 'dark' ? 'table-dark' : ''">
          <thead>
            <tr>
              <th>行</th>
              <th>列</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(cannon, index) in cannons" :key="'cannon-' + index">
              <td>{{ cannon.row }}</td>
              <td>{{ cannon.col }}</td>
              <td>
                <button class="btn btn-sm btn-danger" @click="removeCannon(cannon.row, cannon.col)">
                  移除
                </button>
              </td>
            </tr>
            <tr v-if="cannons.length === 0">
              <td colspan="3" class="text-center">还未放置任何炮</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'FieldPage',
  data() {
    return {
      rowsInput: 5
    };
  },
  computed: {
    rows() {
      return this.$store.state.rows;
    },
    cannons() {
      return this.$store.state.cannons;
    },
    theme() {
      return this.$store.state.theme;
    }
  },
  mounted() {
    this.rowsInput = this.rows;
  },
  methods: {
    updateRows() {
      const rows = Math.max(1, Math.min(10, this.rowsInput));
      this.$store.commit('setRows', rows);
      this.rowsInput = rows;
      
      // Remove cannons that are now out of bounds
      const validCannons = this.cannons.filter(c => c.row <= rows);
      if (validCannons.length !== this.cannons.length) {
        this.$store.commit('setCannons', validCannons);
      }
    },
    hasCannon(row, col) {
      // A cannon occupies 2 cells horizontally
      return this.cannons.some(c => 
        c.row === row && (c.col === col || c.col === col - 1)
      );
    },
    toggleCannon(row, col) {
      // Check if there's already a cannon at this position
      if (this.hasCannon(row, col)) {
        // Find the cannon and remove it
        const cannon = this.cannons.find(c => 
          c.row === row && (c.col === col || c.col === col - 1)
        );
        if (cannon) {
          this.removeCannon(cannon.row, cannon.col);
        }
      } else {
        // Check if we can place a cannon here (need 2 empty cells)
        if (col < 9 && !this.hasCannon(row, col + 1)) {
          this.addCannon(row, col);
        } else if (col > 1 && !this.hasCannon(row, col - 1)) {
          this.addCannon(row, col - 1);
        }
      }
    },
    addCannon(row, col) {
      this.$store.commit('addCannon', { row, col });
    },
    removeCannon(row, col) {
      this.$store.commit('removeCannon', { row, col });
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