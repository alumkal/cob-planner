/**
 * Waves module for Vuex store
 * Manages wave configurations and operations
 */

import { getWaves, setWaves } from '../../utils/storage.js';

const state = () => ({
  waves: getWaves()
});

const getters = {
  waves: (state) => state.waves,
  waveCount: (state) => state.waves.length,
  hasWaves: (state) => state.waves.length > 0,
  // Get total operations count
  totalOperations: (state) => {
    return state.waves.reduce((total, wave) => {
      return total + wave.operations.filter(op => op.type === 'fire').length;
    }, 0);
  },
  // Get wave by index
  getWave: (state) => (index) => {
    return state.waves[index] || null;
  },
  // Get operation by wave and operation index
  getOperation: (state) => (waveIndex, opIndex) => {
    const wave = state.waves[waveIndex];
    return wave && wave.operations[opIndex] || null;
  },
  // Get all fire operations flattened
  allFireOperations: (state) => {
    const operations = [];
    state.waves.forEach((wave, waveIndex) => {
      wave.operations.forEach((op, opIndex) => {
        if (op.type === 'fire') {
          operations.push({
            ...op,
            waveIndex,
            opIndex
          });
        }
      });
    });
    return operations;
  }
};

const mutations = {
  SET_WAVES(state, waves) {
    state.waves = waves.map(wave => ({
      ...wave,
      notes: wave.notes || ''
    }));
    setWaves(state.waves);
  },
  ADD_WAVE(state) {
    state.waves.push({
      duration: 601,
      notes: '',
      operations: []
    });
    setWaves(state.waves);
  },
  REMOVE_WAVE(state, index) {
    state.waves.splice(index, 1);
    setWaves(state.waves);
  },
  UPDATE_WAVE(state, { index, wave }) {
    if (state.waves[index]) {
      state.waves[index] = { ...wave };
      setWaves(state.waves);
    }
  },
  ADD_OPERATION(state, { waveIndex, operation }) {
    if (state.waves[waveIndex]) {
      state.waves[waveIndex].operations.push(operation);
      setWaves(state.waves);
    }
  },
  INSERT_OPERATION(state, { waveIndex, opIndex, operation }) {
    if (state.waves[waveIndex]) {
      state.waves[waveIndex].operations.splice(opIndex, 0, operation);
      setWaves(state.waves);
    }
  },
  REMOVE_OPERATION(state, { waveIndex, opIndex }) {
    if (state.waves[waveIndex] && state.waves[waveIndex].operations[opIndex]) {
      state.waves[waveIndex].operations.splice(opIndex, 1);
      setWaves(state.waves);
    }
  },
  UPDATE_OPERATION(state, { waveIndex, opIndex, operation }) {
    if (state.waves[waveIndex] && state.waves[waveIndex].operations[opIndex]) {
      state.waves[waveIndex].operations[opIndex] = { ...operation };
      setWaves(state.waves);
    }
  },
  CLEAR_WAVES(state) {
    state.waves = [];
    setWaves(state.waves);
  },
  // Drag and drop mutations
  MOVE_OPERATION_WITHIN_WAVE(state, { waveIndex, fromIndex, toIndex }) {
    if (state.waves[waveIndex] && 
        fromIndex >= 0 && fromIndex < state.waves[waveIndex].operations.length &&
        toIndex >= 0 && toIndex < state.waves[waveIndex].operations.length) {
      const operations = state.waves[waveIndex].operations;
      const [movedOperation] = operations.splice(fromIndex, 1);
      operations.splice(toIndex, 0, movedOperation);
      setWaves(state.waves);
    }
  },
  MOVE_OPERATION_BETWEEN_WAVES(state, { fromWaveIndex, fromOpIndex, toWaveIndex, toOpIndex }) {
    if (state.waves[fromWaveIndex] && state.waves[toWaveIndex] &&
        fromOpIndex >= 0 && fromOpIndex < state.waves[fromWaveIndex].operations.length &&
        toOpIndex >= 0 && toOpIndex <= state.waves[toWaveIndex].operations.length) {
      const [movedOperation] = state.waves[fromWaveIndex].operations.splice(fromOpIndex, 1);
      state.waves[toWaveIndex].operations.splice(toOpIndex, 0, movedOperation);
      setWaves(state.waves);
    }
  },
  MOVE_WAVE(state, { fromIndex, toIndex }) {
    if (fromIndex >= 0 && fromIndex < state.waves.length &&
        toIndex >= 0 && toIndex < state.waves.length) {
      const [movedWave] = state.waves.splice(fromIndex, 1);
      state.waves.splice(toIndex, 0, movedWave);
      setWaves(state.waves);
    }
  }
};

const actions = {
  setWaves({ commit }, waves) {
    commit('SET_WAVES', waves);
  },
  addWave({ commit }) {
    commit('ADD_WAVE');
  },
  removeWave({ commit }, index) {
    commit('REMOVE_WAVE', index);
  },
  updateWave({ commit }, payload) {
    commit('UPDATE_WAVE', payload);
  },
  addOperation({ commit }, payload) {
    // Default operation template
    const defaultOperation = {
      type: 'fire',
      time: '0',
      columns: '1-8',
      row: 1,
      targetCol: 9,
      ...payload.operation
    };
    
    commit('ADD_OPERATION', {
      waveIndex: payload.waveIndex,
      operation: defaultOperation
    });
  },
  insertOperation({ commit }, payload) {
    commit('INSERT_OPERATION', payload);
  },
  removeOperation({ commit }, payload) {
    commit('REMOVE_OPERATION', payload);
  },
  updateOperation({ commit }, payload) {
    commit('UPDATE_OPERATION', payload);
  },
  clearWaves({ commit }) {
    commit('CLEAR_WAVES');
  },
  // Bulk operations
  duplicateWave({ commit, state }, index) {
    const wave = state.waves[index];
    if (wave) {
      const duplicatedWave = {
        ...wave,
        operations: wave.operations.map(op => ({ ...op }))
      };
      commit('ADD_WAVE');
      const newIndex = state.waves.length - 1;
      commit('UPDATE_WAVE', { index: newIndex, wave: duplicatedWave });
    }
  },
  moveWave({ commit, state }, { fromIndex, toIndex }) {
    if (fromIndex >= 0 && fromIndex < state.waves.length &&
        toIndex >= 0 && toIndex < state.waves.length) {
      const waves = [...state.waves];
      const [movedWave] = waves.splice(fromIndex, 1);
      waves.splice(toIndex, 0, movedWave);
      commit('SET_WAVES', waves);
    }
  },
  // Drag and drop actions
  moveOperationWithinWave({ commit }, { waveIndex, fromIndex, toIndex }) {
    commit('MOVE_OPERATION_WITHIN_WAVE', { waveIndex, fromIndex, toIndex });
  },
  moveOperationBetweenWaves({ commit }, { fromWaveIndex, fromOpIndex, toWaveIndex, toOpIndex }) {
    commit('MOVE_OPERATION_BETWEEN_WAVES', { fromWaveIndex, fromOpIndex, toWaveIndex, toOpIndex });
  },
  moveWaveDragDrop({ commit }, { fromIndex, toIndex }) {
    commit('MOVE_WAVE', { fromIndex, toIndex });
  }
};

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
};