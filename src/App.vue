<template>
  <div :class="['app-container', theme]">
    <router-view />
  </div>
</template>

<script>
export default {
  name: 'App',
  computed: {
    theme() {
      return this.$store.getters['ui/theme'];
    }
  }
}
</script>

<style>
:root {
  --light-bg: #f8f9fa;
  --light-text: #212529;
  --light-primary: #0d6efd;
  --light-secondary: #6c757d;
  --light-success: #198754;
  --light-danger: #dc3545;
  --light-border: #dee2e6;
  
  --dark-bg: #212529;
  --dark-text: #f8f9fa;
  --dark-primary: #0d6efd;
  --dark-secondary: #6c757d;
  --dark-success: #198754;
  --dark-danger: #dc3545;
  --dark-border: #495057;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: Arial, sans-serif;
  line-height: 1.6;
}

.app-container {
  min-height: 100vh;
  transition: background-color 0.3s, color 0.3s;
}

.light {
  background-color: var(--light-bg);
  color: var(--light-text);
}

.dark {
  background-color: var(--dark-bg);
  color: var(--dark-text);
}

.light button {
  background-color: var(--light-primary);
  color: white;
}

.dark button {
  background-color: var(--dark-primary);
  color: white;
}

.light .card {
  background-color: white;
  border: 1px solid var(--light-border);
}

.dark .card {
  background-color: #343a40;
  border: 1px solid var(--dark-border);
  color: var(--dark-text);
}

.card-header {
  min-height: 3.5rem;
  display: flex;
  align-items: center;
}

.success-bg {
  background-color: var(--light-success) !important;
  color: white !important;
}

.error-bg {
  background-color: var(--light-danger) !important;
  color: white !important;
}

.dark .success-bg {
  background-color: var(--dark-success) !important;
  color: white !important;
}

.dark .error-bg {
  background-color: var(--dark-danger) !important;
  color: white !important;
}

.dark input.form-control,
.dark input.form-control-sm,
.dark select.form-select,
.dark select.form-select-sm,
.dark textarea.form-control {
  background-color: #495057;
  border-color: #6c757d;
  color: #f8f9fa;
}

.dark input.form-control::placeholder,
.dark input.form-control-sm::placeholder,
.dark textarea.form-control::placeholder {
  color: #adb5bd;
}

.dark input.form-control:focus,
.dark input.form-control-sm:focus,
.dark select.form-select:focus,
.dark select.form-select-sm:focus,
.dark textarea.form-control:focus {
  background-color: #495057;
  border-color: #80bdff;
  color: #f8f9fa;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}
</style>