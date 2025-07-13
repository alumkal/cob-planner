/**
 * Vuex store with modular structure
 * Combines all store modules and provides root-level functionality
 */

import { createStore } from 'vuex';
import ui from './modules/ui.js';
import field from './modules/field.js';
import waves from './modules/waves.js';
import { importData, exportData } from '../utils/storage.js';

// Root state for global application state
const state = () => ({
  // Any global state can go here
});

// Root getters that combine data from multiple modules
const getters = {
  // Convenience getter to access theme from ui module
  theme: (state, getters) => getters['ui/theme'],
  isDarkTheme: (state, getters) => getters['ui/isDarkTheme'],
  
  // Export data getter
  exportData: (state, getters) => {
    return {
      fieldName: getters['field/fieldName'],
      rows: getters['field/rows'],
      cannons: getters['field/cannons'],
      waves: getters['waves/waves']
    };
  }
};

// Root mutations for cross-module operations
const mutations = {
  // Mutation to import data across all modules
  IMPORT_DATA(state, data) {
    // This will be handled by the action which commits to individual modules
  }
};

// Root actions for operations that affect multiple modules
const actions = {
  // Import data action that updates multiple modules
  importData({ dispatch }, data) {
    const importedState = importData(data);
    
    // Update each module with imported data
    if (importedState.fieldName !== undefined) {
      dispatch('field/setFieldName', importedState.fieldName);
    }
    if (importedState.rows !== undefined) {
      dispatch('field/setRows', importedState.rows);
    }
    if (importedState.cannons !== undefined) {
      dispatch('field/setCannons', importedState.cannons);
    }
    if (importedState.waves !== undefined) {
      dispatch('waves/setWaves', importedState.waves);
    }
    
    return importedState;
  },
  
  // Export data action
  exportData({ getters }) {
    return getters.exportData;
  },
  
  // Clear all data
  clearAllData({ dispatch }) {
    dispatch('field/setFieldName', '');
    dispatch('field/setRows', 5);
    dispatch('field/clearCannons');
    dispatch('waves/clearWaves');
  },
  
  // Reset to defaults
  resetToDefaults({ dispatch }) {
    dispatch('clearAllData');
    dispatch('ui/setTheme', 'light');
  },
  
  // Restore field state for undo/redo functionality
  restoreFieldState({ dispatch }, fieldState) {
    if (fieldState.fieldName !== undefined) {
      dispatch('field/setFieldName', fieldState.fieldName);
    }
    if (fieldState.rows !== undefined) {
      dispatch('field/setRows', fieldState.rows);
    }
    if (fieldState.cannons !== undefined) {
      dispatch('field/setCannons', fieldState.cannons);
    }
  },
  
  // Restore waves state for undo/redo functionality
  restoreWavesState({ dispatch }, wavesState) {
    if (wavesState.waves !== undefined) {
      dispatch('waves/setWaves', wavesState.waves);
    }
  }
};

// Create and export the store
export default createStore({
  state,
  getters,
  mutations,
  actions,
  modules: {
    ui,
    field,
    waves
  },
  // Enable strict mode in development
  strict: process.env.NODE_ENV !== 'production'
});