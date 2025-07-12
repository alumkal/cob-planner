/**
 * Theme utilities for CobPlanner
 * Provides theme-related functionality and CSS variable management
 */

/**
 * CSS custom properties for light theme
 */
export const LIGHT_THEME_VARS = {
  '--theme-bg': '#f8f9fa',
  '--theme-text': '#212529',
  '--theme-primary': '#0d6efd',
  '--theme-secondary': '#6c757d',
  '--theme-success': '#198754',
  '--theme-danger': '#dc3545',
  '--theme-border': '#dee2e6'
};

/**
 * CSS custom properties for dark theme
 */
export const DARK_THEME_VARS = {
  '--theme-bg': '#212529',
  '--theme-text': '#f8f9fa',
  '--theme-primary': '#0d6efd',
  '--theme-secondary': '#6c757d',
  '--theme-success': '#198754',
  '--theme-danger': '#dc3545',
  '--theme-border': '#495057'
};

/**
 * Apply theme CSS variables to the document root
 * @param {string} theme - Theme name ('light' or 'dark')
 */
export function applyThemeVars(theme) {
  const root = document.documentElement;
  const vars = theme === 'dark' ? DARK_THEME_VARS : LIGHT_THEME_VARS;
  
  Object.entries(vars).forEach(([property, value]) => {
    root.style.setProperty(property, value);
  });
}

/**
 * Get CSS class names based on theme
 * @param {string} theme - Theme name ('light' or 'dark')
 * @param {string} baseClass - Base CSS class name
 * @returns {string} CSS class names with theme modifier
 */
export function getThemeClass(theme, baseClass = '') {
  const classes = [baseClass];
  if (theme === 'dark') {
    classes.push('dark-theme');
  }
  return classes.filter(Boolean).join(' ');
}

/**
 * Get navbar CSS classes based on theme
 * @param {string} theme - Theme name ('light' or 'dark')
 * @returns {string} Navbar CSS classes
 */
export function getNavbarClass(theme) {
  return theme === 'light' ? 'navbar-light bg-light' : 'navbar-dark bg-dark';
}

/**
 * Get table CSS classes based on theme
 * @param {string} theme - Theme name ('light' or 'dark')
 * @returns {string} Table CSS classes
 */
export function getTableClass(theme) {
  return theme === 'dark' ? 'table-dark' : '';
}

/**
 * Check if current theme is dark
 * @param {string} theme - Theme name
 * @returns {boolean} True if theme is dark
 */
export function isDarkTheme(theme) {
  return theme === 'dark';
}

/**
 * Get the opposite theme
 * @param {string} theme - Current theme name
 * @returns {string} Opposite theme name
 */
export function getOppositeTheme(theme) {
  return theme === 'light' ? 'dark' : 'light';
}

/**
 * Get theme-specific button text for theme toggle
 * @param {string} theme - Current theme name
 * @returns {string} Button text for theme toggle
 */
export function getThemeToggleText(theme) {
  return theme === 'light' ? '深色模式' : '浅色模式';
}

/**
 * Mixin for Vue components that need theme support
 * Provides computed properties commonly used across components
 */
export const themeMixin = {
  computed: {
    themeClass() {
      return getThemeClass(this.theme);
    },
    isDark() {
      return isDarkTheme(this.theme);
    },
    navbarClass() {
      return getNavbarClass(this.theme);
    },
    tableClass() {
      return getTableClass(this.theme);
    },
    themeToggleText() {
      return getThemeToggleText(this.theme);
    }
  }
};

/**
 * Vue composable for theme functionality (Vue 3 Composition API)
 * @param {Ref} theme - Reactive theme reference
 * @returns {Object} Theme-related computed properties and methods
 */
export function useTheme(theme) {
  const themeClass = computed(() => getThemeClass(theme.value));
  const isDark = computed(() => isDarkTheme(theme.value));
  const navbarClass = computed(() => getNavbarClass(theme.value));
  const tableClass = computed(() => getTableClass(theme.value));
  const themeToggleText = computed(() => getThemeToggleText(theme.value));
  
  const toggleTheme = () => {
    theme.value = getOppositeTheme(theme.value);
  };
  
  // Apply theme variables when theme changes
  watch(theme, (newTheme) => {
    applyThemeVars(newTheme);
  }, { immediate: true });
  
  return {
    themeClass,
    isDark,
    navbarClass,
    tableClass,
    themeToggleText,
    toggleTheme,
    applyThemeVars: () => applyThemeVars(theme.value)
  };
}