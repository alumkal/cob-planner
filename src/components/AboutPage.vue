<template>
  <div class="about-page">
    <div class="card mb-4">
      <div class="card-header">
        <h5 class="mb-0">关于屋顶炮复用计算器</h5>
      </div>
      <div class="card-body">
        
        <!-- 版本信息 -->
        <div class="section mb-4">
          <h4>版本信息</h4>
          <p><strong>屋顶炮复用计算器</strong> v0.2.0</p>
          <p class="small text-muted">构建时间：{{ buildTime }}</p>
        </div>

        <!-- 致谢 -->
        <div class="section mb-4">
          <h4>致谢</h4>
          <p>
            本项目的全部代码由 <a href="https://www.anthropic.com/claude-code" target="_blank" rel="noopener noreferrer">Claude Code</a> 实现。作者仅以自然语言提供指令。
          </p>
          <p>
            特别感谢开源社区提供的优秀工具和库：
          </p>
          <ul class="small">
            <li>Vue.js - 前端框架</li>
            <li>Bootstrap - UI组件库</li>
            <li>logic-solver - SAT求解器</li>
            <li>Vite - 构建工具</li>
          </ul>
        </div>

        <!-- 版权声明 -->
        <div class="section">
          <h4>版权声明</h4>
          <p class="small text-muted">
            © 2025 AlumKal, Claude Sonnet 4<br>本工具仅用于学习和娱乐目的，与游戏官方无关。
          </p>
          <p class="small text-muted">
            基于 Vue.js 构建，采用开源许可证发布。
          </p>
        </div>

      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'

export default {
  name: 'AboutPage',
  setup() {
    const buildTime = computed(() => {
      return new Date().toLocaleDateString('zh-CN')
    })
    
    return {
      buildTime
    }
  }
}
</script>

<style scoped>
.section {
  border-bottom: 1px solid var(--bs-border-color);
  padding-bottom: 1.5rem;
}

.section:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

h4 {
  margin-bottom: 1.25rem;
}
</style>