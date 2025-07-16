<template>
  <div class="container-fluid p-0">
    <nav class="navbar navbar-expand-lg" :class="theme === 'light' ? 'navbar-light bg-light' : 'navbar-dark bg-dark'">
      <div class="container">
        <router-link class="navbar-brand" to="/">屋顶炮复用计算器</router-link>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav me-auto">
            <li class="nav-item">
              <router-link class="nav-link" to="/field">布阵设置</router-link>
            </li>
            <li class="nav-item">
              <router-link class="nav-link" to="/reuse">复用计算</router-link>
            </li>
            <li class="nav-item">
              <router-link class="nav-link" to="/help">帮助</router-link>
            </li>
            <li class="nav-item">
              <router-link class="nav-link" to="/about">关于</router-link>
            </li>
          </ul>
          <div class="d-flex">
            <button 
              class="btn btn-outline-secondary me-2" 
              @click="undo" 
              :disabled="!canUndo"
              title="撤销 (Ctrl+Z)"
            >
              ↶ 撤销
            </button>
            <button 
              class="btn btn-outline-secondary me-2" 
              @click="redo" 
              :disabled="!canRedo"
              title="重做 (Ctrl+Y)"
            >
              ↷ 重做
            </button>
            <button class="btn btn-outline-primary me-2" @click="toggleTheme">
              {{ theme === 'light' ? '深色模式' : '浅色模式' }}
            </button>
            <button class="btn btn-outline-success me-2" @click="saveData">保存</button>
            <button class="btn btn-outline-info" @click="loadData">加载</button>
            <input type="file" ref="fileInput" style="display: none" @change="handleFileUpload" accept=".json" />
          </div>
        </div>
      </div>
    </nav>
    
    <div class="container mt-4">
      <router-view />
    </div>
  </div>
</template>

<script>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useStore } from 'vuex';
import { useUndoRedo } from '../composables/useUndoRedo.js';

export default {
  name: 'Layout',
  setup() {
    const store = useStore();
    const fileInput = ref(null);
    const { canUndo, canRedo, undo, redo } = useUndoRedo();
    
    const theme = computed(() => store.getters['ui/theme']);
    
    const toggleTheme = () => {
      store.dispatch('ui/toggleTheme');
    };
    
    const saveData = async () => {
      const data = await store.dispatch('exportData');
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      const fieldName = store.getters['field/fieldName']?.trim();
      a.download = fieldName ? `${fieldName}.json` : 'cobplanner-data.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };
    
    const loadData = () => {
      fileInput.value.click();
    };
    
    const handleFileUpload = async (event) => {
      const file = event.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = JSON.parse(e.target.result);
          await store.dispatch('importData', data);
          alert('数据加载成功!');
        } catch (error) {
          alert('数据加载失败: ' + error.message);
        }
      };
      reader.readAsText(file);
      
      // Reset the file input
      event.target.value = '';
    };
    
    // Keyboard shortcuts for undo/redo
    const handleKeydown = (event) => {
      // Check if user is editing an input field
      const activeElement = document.activeElement;
      const isEditing = activeElement && (
        activeElement.tagName === 'INPUT' || 
        activeElement.tagName === 'TEXTAREA' || 
        activeElement.tagName === 'SELECT' ||
        activeElement.isContentEditable
      );
      
      // Don't handle undo/redo shortcuts if user is editing
      if (isEditing) return;
      
      if (event.ctrlKey || event.metaKey) {
        if (event.key === 'z' && !event.shiftKey) {
          event.preventDefault();
          undo();
        } else if (event.key === 'y' || (event.key === 'z' && event.shiftKey)) {
          event.preventDefault();
          redo();
        }
      }
    };
    
    onMounted(() => {
      document.addEventListener('keydown', handleKeydown);
    });
    
    onUnmounted(() => {
      document.removeEventListener('keydown', handleKeydown);
    });
    
    return {
      fileInput,
      theme,
      canUndo,
      canRedo,
      undo,
      redo,
      toggleTheme,
      saveData,
      loadData,
      handleFileUpload
    };
  }
}
</script>

<style scoped>
.navbar {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
</style>