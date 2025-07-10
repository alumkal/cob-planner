import { createApp } from 'vue';
import { createStore } from 'vuex';
import { createRouter, createWebHistory } from 'vue-router';
import App from './App.vue';
import Layout from './components/Layout.vue';
import FieldPage from './components/FieldPage.vue';
import ReusePage from './components/ReusePage.vue';

// Create Vuex store
const store = createStore({
  state() {
    return {
      theme: localStorage.getItem('theme') || 'light',
      rows: parseInt(localStorage.getItem('rows') || '5'),
      cannons: JSON.parse(localStorage.getItem('cannons') || '[]'),
      waves: JSON.parse(localStorage.getItem('waves') || '[]'),
    };
  },
  mutations: {
    toggleTheme(state) {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', state.theme);
    },
    setRows(state, rows) {
      state.rows = rows;
      localStorage.setItem('rows', rows);
    },
    setCannons(state, cannons) {
      state.cannons = cannons;
      localStorage.setItem('cannons', JSON.stringify(cannons));
    },
    setWaves(state, waves) {
      state.waves = waves;
      localStorage.setItem('waves', JSON.stringify(waves));
    },
    addCannon(state, { row, col }) {
      // Check if cannon already exists at this position
      const exists = state.cannons.some(c => c.row === row && c.col === col);
      if (!exists) {
        state.cannons.push({ row, col });
        localStorage.setItem('cannons', JSON.stringify(state.cannons));
      }
    },
    removeCannon(state, { row, col }) {
      state.cannons = state.cannons.filter(c => !(c.row === row && c.col === col));
      localStorage.setItem('cannons', JSON.stringify(state.cannons));
    },
    addWave(state) {
      state.waves.push({
        duration: 601,
        operations: []
      });
      localStorage.setItem('waves', JSON.stringify(state.waves));
    },
    removeWave(state, index) {
      state.waves.splice(index, 1);
      localStorage.setItem('waves', JSON.stringify(state.waves));
    },
    updateWave(state, { index, wave }) {
      state.waves[index] = wave;
      localStorage.setItem('waves', JSON.stringify(state.waves));
    },
    addOperation(state, { waveIndex, operation }) {
      state.waves[waveIndex].operations.push(operation);
      localStorage.setItem('waves', JSON.stringify(state.waves));
    },
    removeOperation(state, { waveIndex, opIndex }) {
      state.waves[waveIndex].operations.splice(opIndex, 1);
      localStorage.setItem('waves', JSON.stringify(state.waves));
    },
    updateOperation(state, { waveIndex, opIndex, operation }) {
      state.waves[waveIndex].operations[opIndex] = operation;
      localStorage.setItem('waves', JSON.stringify(state.waves));
    },
    importData(state, data) {
      if (data.rows) state.rows = data.rows;
      if (data.cannons) state.cannons = data.cannons;
      if (data.waves) state.waves = data.waves;
      
      localStorage.setItem('rows', state.rows);
      localStorage.setItem('cannons', JSON.stringify(state.cannons));
      localStorage.setItem('waves', JSON.stringify(state.waves));
    }
  }
});

// Create router
const routes = [
  { 
    path: '/', 
    component: Layout,
    children: [
      { path: '', redirect: '/field' },
      { path: 'field', component: FieldPage },
      { path: 'reuse', component: ReusePage }
    ]
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// Create and mount the app
const app = createApp(App);
app.use(store);
app.use(router);
app.mount('#app');