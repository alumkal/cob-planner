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
          </ul>
          <div class="d-flex">
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
export default {
  name: 'Layout',
  computed: {
    theme() {
      return this.$store.getters['ui/theme'];
    }
  },
  methods: {
    toggleTheme() {
      this.$store.dispatch('ui/toggleTheme');
    },
    async saveData() {
      const data = await this.$store.dispatch('exportData');
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      const fieldName = this.$store.getters['field/fieldName']?.trim();
      a.download = fieldName ? `${fieldName}.json` : 'cobplanner-data.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    loadData() {
      this.$refs.fileInput.click();
    },
    async handleFileUpload(event) {
      const file = event.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = JSON.parse(e.target.result);
          await this.$store.dispatch('importData', data);
          alert('数据加载成功!');
        } catch (error) {
          alert('数据加载失败: ' + error.message);
        }
      };
      reader.readAsText(file);
      
      // Reset the file input
      event.target.value = '';
    }
  }
}
</script>

<style scoped>
.navbar {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
</style>