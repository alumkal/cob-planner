/**
 * UI module for Vuex store
 * Manages theme and other UI-related state
 */

import { getTheme, setTheme } from '../../utils/storage.js';

const state = () => ({
  theme: getTheme()
});

const getters = {
  theme: (state) => state.theme,
  isDarkTheme: (state) => state.theme === 'dark'
};

const mutations = {
  SET_THEME(state, theme) {
    state.theme = theme;
    setTheme(theme);
  },
  TOGGLE_THEME(state) {
    const newTheme = state.theme === 'light' ? 'dark' : 'light';
    state.theme = newTheme;
    setTheme(newTheme);
  }
};

const actions = {
  setTheme({ commit }, theme) {
    commit('SET_THEME', theme);
  },
  toggleTheme({ commit }) {
    commit('TOGGLE_THEME');
  }
};

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
};