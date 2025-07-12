/**
 * Field module for Vuex store
 * Manages field configuration and cannon placement
 */

import { getFieldName, setFieldName, getRows, setRows, getCannons, setCannons } from '../../utils/storage.js';

const state = () => ({
  fieldName: getFieldName(),
  rows: getRows(),
  cannons: getCannons()
});

const getters = {
  fieldName: (state) => state.fieldName,
  rows: (state) => state.rows,
  cannons: (state) => state.cannons,
  cannonCount: (state) => state.cannons.length,
  hasCannons: (state) => state.cannons.length > 0,
  // Get cannon at specific position
  getCannonAt: (state) => (row, col) => {
    return state.cannons.find(c => c.row === row && c.col === col);
  },
  // Check if there's a cannon at position (considering 1x2 size)
  hasCannonAt: (state) => (row, col) => {
    return state.cannons.some(c => 
      c.row === row && (c.col === col || c.col === col - 1)
    );
  }
};

const mutations = {
  SET_FIELD_NAME(state, fieldName) {
    state.fieldName = fieldName;
    setFieldName(fieldName);
  },
  SET_ROWS(state, rows) {
    state.rows = rows;
    setRows(rows);
    
    // Remove cannons that are now out of bounds
    const validCannons = state.cannons.filter(c => c.row <= rows);
    if (validCannons.length !== state.cannons.length) {
      state.cannons = validCannons;
      setCannons(state.cannons);
    }
  },
  SET_CANNONS(state, cannons) {
    state.cannons = cannons;
    setCannons(cannons);
  },
  ADD_CANNON(state, { row, col }) {
    // Check if cannon already exists at this position
    const exists = state.cannons.some(c => c.row === row && c.col === col);
    if (!exists) {
      state.cannons.push({ row, col });
      setCannons(state.cannons);
    }
  },
  REMOVE_CANNON(state, { row, col }) {
    state.cannons = state.cannons.filter(c => !(c.row === row && c.col === col));
    setCannons(state.cannons);
  },
  CLEAR_CANNONS(state) {
    state.cannons = [];
    setCannons(state.cannons);
  }
};

const actions = {
  setFieldName({ commit }, fieldName) {
    commit('SET_FIELD_NAME', fieldName);
  },
  setRows({ commit }, rows) {
    const validRows = Math.max(1, Math.min(10, rows));
    commit('SET_ROWS', validRows);
  },
  setCannons({ commit }, cannons) {
    commit('SET_CANNONS', cannons);
  },
  addCannon({ commit }, cannon) {
    commit('ADD_CANNON', cannon);
  },
  removeCannon({ commit }, cannon) {
    commit('REMOVE_CANNON', cannon);
  },
  clearCannons({ commit }) {
    commit('CLEAR_CANNONS');
  },
  // Toggle cannon at position (add if doesn't exist, remove if exists)
  toggleCannon({ commit, getters }, { row, col }) {
    if (getters.hasCannonAt(row, col)) {
      // Find the actual cannon and remove it
      const cannon = getters.cannons.find(c =>
        c.row === row && (c.col === col || c.col === col - 1)
      );
      if (cannon) {
        commit('REMOVE_CANNON', { row: cannon.row, col: cannon.col });
      }
    } else {
      // Try to place a cannon
      if (col < 9 && !getters.hasCannonAt(row, col + 1)) {
        commit('ADD_CANNON', { row, col });
      } else if (col > 1 && !getters.hasCannonAt(row, col - 1)) {
        commit('ADD_CANNON', { row, col: col - 1 });
      }
    }
  }
};

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
};