/**
 * Local storage utilities for CobPlanner
 * Provides centralized localStorage operations with error handling
 */

/**
 * Storage keys used by the application
 */
export const STORAGE_KEYS = {
  THEME: 'theme',
  FIELD_NAME: 'fieldName',
  ROWS: 'rows',
  CANNONS: 'cannons',
  WAVES: 'waves'
};

/**
 * Default values for storage items
 */
export const DEFAULT_VALUES = {
  [STORAGE_KEYS.THEME]: 'light',
  [STORAGE_KEYS.FIELD_NAME]: '',
  [STORAGE_KEYS.ROWS]: 5,
  [STORAGE_KEYS.CANNONS]: [],
  [STORAGE_KEYS.WAVES]: []
};

/**
 * Get item from localStorage with error handling
 * @param {string} key - Storage key
 * @param {*} defaultValue - Default value if not found or error occurs
 * @returns {*} Stored value or default value
 */
export function getStorageItem(key, defaultValue = null) {
  try {
    const item = localStorage.getItem(key);
    if (item === null) {
      return defaultValue;
    }
    return item;
  } catch (error) {
    console.warn(`Failed to get localStorage item "${key}":`, error);
    return defaultValue;
  }
}

/**
 * Get JSON item from localStorage with error handling
 * @param {string} key - Storage key
 * @param {*} defaultValue - Default value if not found or error occurs
 * @returns {*} Parsed JSON value or default value
 */
export function getStorageJSON(key, defaultValue = null) {
  try {
    const item = localStorage.getItem(key);
    if (item === null) {
      return defaultValue;
    }
    return JSON.parse(item);
  } catch (error) {
    console.warn(`Failed to parse localStorage JSON for "${key}":`, error);
    return defaultValue;
  }
}

/**
 * Set item in localStorage with error handling
 * @param {string} key - Storage key
 * @param {*} value - Value to store
 * @returns {boolean} True if successful, false otherwise
 */
export function setStorageItem(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.warn(`Failed to set localStorage item "${key}":`, error);
    return false;
  }
}

/**
 * Set JSON item in localStorage with error handling
 * @param {string} key - Storage key
 * @param {*} value - Value to store as JSON
 * @returns {boolean} True if successful, false otherwise
 */
export function setStorageJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn(`Failed to set localStorage JSON for "${key}":`, error);
    return false;
  }
}

/**
 * Remove item from localStorage with error handling
 * @param {string} key - Storage key
 * @returns {boolean} True if successful, false otherwise
 */
export function removeStorageItem(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.warn(`Failed to remove localStorage item "${key}":`, error);
    return false;
  }
}

/**
 * Check if localStorage is available
 * @returns {boolean} True if localStorage is available
 */
export function isStorageAvailable() {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get theme from localStorage
 * @returns {string} Theme name ('light' or 'dark')
 */
export function getTheme() {
  return getStorageItem(STORAGE_KEYS.THEME, DEFAULT_VALUES[STORAGE_KEYS.THEME]);
}

/**
 * Set theme in localStorage
 * @param {string} theme - Theme name
 * @returns {boolean} True if successful
 */
export function setTheme(theme) {
  return setStorageItem(STORAGE_KEYS.THEME, theme);
}

/**
 * Get field name from localStorage
 * @returns {string} Field name
 */
export function getFieldName() {
  return getStorageItem(STORAGE_KEYS.FIELD_NAME, DEFAULT_VALUES[STORAGE_KEYS.FIELD_NAME]);
}

/**
 * Set field name in localStorage
 * @param {string} fieldName - Field name
 * @returns {boolean} True if successful
 */
export function setFieldName(fieldName) {
  return setStorageItem(STORAGE_KEYS.FIELD_NAME, fieldName);
}

/**
 * Get rows from localStorage
 * @returns {number} Number of rows
 */
export function getRows() {
  const rows = getStorageItem(STORAGE_KEYS.ROWS, DEFAULT_VALUES[STORAGE_KEYS.ROWS]);
  return parseInt(rows) || DEFAULT_VALUES[STORAGE_KEYS.ROWS];
}

/**
 * Set rows in localStorage
 * @param {number} rows - Number of rows
 * @returns {boolean} True if successful
 */
export function setRows(rows) {
  return setStorageItem(STORAGE_KEYS.ROWS, rows.toString());
}

/**
 * Get cannons from localStorage
 * @returns {Array} Array of cannon objects
 */
export function getCannons() {
  return getStorageJSON(STORAGE_KEYS.CANNONS, DEFAULT_VALUES[STORAGE_KEYS.CANNONS]);
}

/**
 * Set cannons in localStorage
 * @param {Array} cannons - Array of cannon objects
 * @returns {boolean} True if successful
 */
export function setCannons(cannons) {
  return setStorageJSON(STORAGE_KEYS.CANNONS, cannons);
}

/**
 * Get waves from localStorage
 * @returns {Array} Array of wave objects
 */
export function getWaves() {
  const waves = getStorageJSON(STORAGE_KEYS.WAVES, DEFAULT_VALUES[STORAGE_KEYS.WAVES]);
  // Ensure waves have notes property
  return waves.map(wave => ({
    ...wave,
    notes: wave.notes || ''
  }));
}

/**
 * Set waves in localStorage
 * @param {Array} waves - Array of wave objects
 * @returns {boolean} True if successful
 */
export function setWaves(waves) {
  return setStorageJSON(STORAGE_KEYS.WAVES, waves);
}

/**
 * Load all application state from localStorage
 * @returns {Object} Complete application state
 */
export function loadAppState() {
  return {
    theme: getTheme(),
    fieldName: getFieldName(),
    rows: getRows(),
    cannons: getCannons(),
    waves: getWaves()
  };
}

/**
 * Save all application state to localStorage
 * @param {Object} state - Application state object
 * @returns {boolean} True if all operations successful
 */
export function saveAppState(state) {
  const results = [
    setTheme(state.theme),
    setFieldName(state.fieldName),
    setRows(state.rows),
    setCannons(state.cannons),
    setWaves(state.waves)
  ];
  
  return results.every(result => result === true);
}

/**
 * Clear all application data from localStorage
 * @returns {boolean} True if all operations successful
 */
export function clearAppData() {
  const results = Object.values(STORAGE_KEYS).map(key => removeStorageItem(key));
  return results.every(result => result === true);
}

/**
 * Import data and update localStorage
 * @param {Object} data - Data to import
 * @returns {Object} Updated state object
 */
export function importData(data) {
  const currentState = loadAppState();
  
  const newState = {
    theme: currentState.theme, // Don't import theme
    fieldName: data.fieldName || currentState.fieldName,
    rows: data.rows || currentState.rows,
    cannons: data.cannons || currentState.cannons,
    waves: data.waves ? data.waves.map(wave => ({
      ...wave,
      notes: wave.notes || ''
    })) : currentState.waves
  };
  
  saveAppState(newState);
  return newState;
}

/**
 * Export current application data
 * @returns {Object} Exportable data object
 */
export function exportData() {
  const state = loadAppState();
  return {
    fieldName: state.fieldName,
    rows: state.rows,
    cannons: state.cannons,
    waves: state.waves
  };
}