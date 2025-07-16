<template>
  <div class="help-page">
    <div class="card mb-4">
      <div class="card-header">
        <h5 class="my-0">帮助文档</h5>
      </div>
      <div class="card-body">
        <div class="row">
          <div class="col-md-2">
            <div class="nav flex-column nav-pills" id="v-pills-tab" role="tablist" aria-orientation="vertical">
              <button class="nav-link active" id="v-pills-overview-tab" data-bs-toggle="pill" data-bs-target="#v-pills-overview" type="button" role="tab">
                概述
              </button>
              <button class="nav-link" id="v-pills-field-tab" data-bs-toggle="pill" data-bs-target="#v-pills-field" type="button" role="tab">
                布阵设置
              </button>
              <button class="nav-link" id="v-pills-reuse-tab" data-bs-toggle="pill" data-bs-target="#v-pills-reuse" type="button" role="tab">
                复用计算
              </button>
              <button class="nav-link" id="v-pills-mechanics-tab" data-bs-toggle="pill" data-bs-target="#v-pills-mechanics" type="button" role="tab">
                游戏机制
              </button>
              <button class="nav-link" id="v-pills-ui-tab" data-bs-toggle="pill" data-bs-target="#v-pills-ui" type="button" role="tab">
                界面操作
              </button>
              <button class="nav-link" id="v-pills-tips-tab" data-bs-toggle="pill" data-bs-target="#v-pills-tips" type="button" role="tab">
                使用技巧
              </button>
            </div>
          </div>
          <div class="col-md-10">
            <div class="tab-content" id="v-pills-tabContent">
              
              <!-- 概述 -->
              <div class="tab-pane fade show active" id="v-pills-overview" role="tabpanel">
                <h4>欢迎使用屋顶炮复用计算器</h4>
                <p>这是一个专为植物大战僵尸屋顶关卡设计的工具，帮助玩家优化玉米加农炮的布局和使用策略。</p>
                
                <h5>主要功能</h5>
                <ul>
                  <li><strong>布阵设置</strong>：在5×9的屋顶网格上放置和移除玉米炮</li>
                  <li><strong>复用计算</strong>：计算最优的开火序列和时机</li>
                  <li><strong>数据管理</strong>：保存和加载配置文件</li>
                  <li><strong>撤销重做</strong>：支持操作的撤销和重做</li>
                </ul>

                <h5>快速开始</h5>
                <ol>
                  <li>在"布阵设置"页面放置你的玉米炮</li>
                  <li>切换到"复用计算"页面</li>
                  <li>添加波次和操作</li>
                  <li>点击"计算"获得最优解</li>
                </ol>
              </div>

              <!-- 布阵设置 -->
              <div class="tab-pane fade" id="v-pills-field" role="tabpanel">
                <h4>布阵设置页面</h4>
                
                <h5>基本操作</h5>
                <ul>
                  <li><strong>点击格子</strong>：在空格子上点击放置玉米炮，在有炮的格子上点击移除</li>
                  <li><strong>调整行数</strong>：通过右上角的行数输入框调整场地大小（1-10行）</li>
                  <li><strong>设置名称</strong>：在名称输入框中为你的阵型命名</li>
                </ul>

                <h5>网格说明</h5>
                <ul>
                  <li>网格显示为 行数-列数 格式（如：1-1, 1-2...）</li>
                  <li>有玉米炮的格子会高亮显示</li>
                  <li>列数从1到9，对应屋顶的9列</li>
                </ul>

                <h5>数据保存</h5>
                <p>布阵设置会自动保存到浏览器本地存储，下次打开时会自动恢复。</p>
              </div>

              <!-- 复用计算 -->
              <div class="tab-pane fade" id="v-pills-reuse" role="tabpanel">
                <h4>复用计算页面</h4>
                
                <h5>添加波次</h5>
                <ul>
                  <li>点击"添加波次"按钮</li>
                  <li>设置波次名称（如：R1, R2等）</li>
                  <li>设置波次时长（单位：cs，1秒=100cs）</li>
                  <li>可以使用变量表达式（如：w-200，其中w为波次时长）</li>
                </ul>

                <h5>添加操作</h5>
                <p>支持三种操作类型：</p>
                <ul>
                  <li><strong>放置</strong>：在指定时间和位置放置玉米炮</li>
                  <li><strong>开火</strong>：让玉米炮向指定位置开火</li>
                  <li><strong>移除</strong>：移除指定位置的玉米炮</li>
                </ul>

                <h5>时间表达式</h5>
                <p>时间可以使用以下格式：</p>
                <ul>
                  <li>绝对时间：如 1000（表示1000cs）</li>
                  <li>变量表达式：如 w-200（波次时长减200cs）</li>
                  <li>支持基本运算：+、-</li>
                </ul>

                <h5>计算结果</h5>
                <p>点击"计算"后，系统会：</p>
                <ul>
                  <li>验证所有约束条件</li>
                  <li>计算最优的炮弹分配方案</li>
                  <li>显示详细的执行时间表</li>
                  <li>如果无解会给出错误信息</li>
                </ul>
              </div>

              <!-- 游戏机制 -->
              <div class="tab-pane fade" id="v-pills-mechanics" role="tabpanel">
                <h4>游戏机制说明</h4>
                
                <h5>玉米炮机制</h5>
                <ul>
                  <li><strong>放置时间</strong>：玉米炮需要625cs才能进入可用状态</li>
                  <li><strong>冷却时间</strong>：连续使用同一门炮需要间隔3475cs</li>
                  <li><strong>移除限制</strong>：移除前204cs内不能使用</li>
                  <li><strong>飞行时间</strong>：根据炮的位置和目标位置计算</li>
                </ul>

                <h5>时间单位</h5>
                <p>游戏中的时间单位为cs（centisecond），换算关系：</p>
                <ul>
                  <li>1秒 = 100cs</li>
                  <li>1分钟 = 6000cs</li>
                </ul>

                <h5>目标位置精度</h5>
                <p>开火操作的目标列必须是1/80的倍数（0.0125的倍数），以确保精确定位。</p>

                <h5>飞行时间计算</h5>
                <p>炮弹飞行时间取决于：</p>
                <ul>
                  <li>玉米炮所在列</li>
                  <li>目标列位置</li>
                  <li>屋顶地形的物理特性</li>
                </ul>
              </div>

              <!-- 界面操作 -->
              <div class="tab-pane fade" id="v-pills-ui" role="tabpanel">
                <h4>界面操作</h4>
                
                <h5>选择操作</h5>
                <ul>
                  <li><strong>单击选择</strong>：点击波次或操作卡片进行选择</li>
                  <li><strong>多选</strong>：按住 Ctrl (或 Cmd) 键点击可以选择多个操作或波次</li>
                  <li><strong>选择状态</strong>：选中的项目会显示蓝色边框高亮</li>
                  <li><strong>取消选择</strong>：点击空白区域或按 Esc 键取消选择</li>
                </ul>

                <h5>复制粘贴</h5>
                <ul>
                  <li><strong>Ctrl+C (Cmd+C)</strong>：复制选中的操作或波次</li>
                  <li><strong>Ctrl+V (Cmd+V)</strong>：粘贴操作或波次</li>
                  <li><strong>Ctrl+X (Cmd+X)</strong>：剪切选中的操作或波次</li>
                  <li><strong>Esc键</strong>：清除剪贴板和选择状态</li>
                  <li><strong>多项操作</strong>：支持同时复制粘贴多个选中的项目</li>
                  <li><strong>提示反馈</strong>：复制粘贴操作会显示Toast提示</li>
                </ul>

                <h5>右键菜单</h5>
                <ul>
                  <li><strong>操作右键菜单</strong>：
                    <ul>
                      <li>📋 复制操作</li>
                      <li>📄 粘贴操作</li>
                      <li>🔄 复制并粘贴</li>
                      <li>🗑️ 删除操作</li>
                    </ul>
                  </li>
                  <li><strong>波次右键菜单</strong>：
                    <ul>
                      <li>📋 复制波次</li>
                      <li>📄 粘贴波次</li>
                      <li>🔄 克隆波次</li>
                      <li>🗑️ 删除波次</li>
                    </ul>
                  </li>
                  <li><strong>空白区域右键菜单</strong>：
                    <ul>
                      <li>📄 粘贴操作/波次</li>
                      <li>➕ 添加操作/波次</li>
                    </ul>
                  </li>
                </ul>

                <h5>代码导出</h5>
                <ul>
                  <li><strong>导出按钮</strong>：计算成功后可点击"导出"按钮</li>
                  <li><strong>AvZ2 DSL格式</strong>：生成可直接使用的AvZ2脚本代码</li>
                  <li><strong>包含备注选项</strong>：可选择是否在导出代码中包含注释</li>
                  <li><strong>复制到剪贴板</strong>：一键复制生成的代码</li>
                </ul>

                <h5>其他交互</h5>
                <ul>
                  <li><strong>悬停高亮</strong>：鼠标悬停在操作上会高亮相关的炮使用情况</li>
                  <li><strong>操作状态显示</strong>：成功/失败的操作会有不同的视觉反馈</li>
                  <li><strong>主题切换</strong>：支持浅色/深色主题切换</li>
                </ul>
              </div>

              <!-- 使用技巧 -->
              <div class="tab-pane fade" id="v-pills-tips" role="tabpanel">
                <h4>使用技巧</h4>
                
                <h5>快捷键</h5>
                <ul>
                  <li><strong>Ctrl+Z</strong>：撤销上一步操作</li>
                  <li><strong>Ctrl+Y</strong>：重做被撤销的操作</li>
                </ul>


                <h5>计算优化</h5>
                <ul>
                  <li>使用有意义的波次和操作名称便于理解</li>
                  <li>合理设置时间表达式，利用变量简化输入</li>
                  <li>如果计算失败，检查是否违反了冷却时间约束</li>
                </ul>

                <h5>数据管理</h5>
                <ul>
                  <li>定期保存重要的配置文件</li>
                  <li>使用有意义的文件名便于识别</li>
                  <li>可以为不同关卡创建不同的配置</li>
                </ul>

                <h5>故障排除</h5>
                <ul>
                  <li><strong>无解情况</strong>：检查玉米炮数量是否足够</li>
                  <li><strong>时间冲突</strong>：调整操作时间或增加玉米炮</li>
                  <li><strong>精度错误</strong>：确保目标列为0.0125的倍数</li>
                </ul>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { onMounted } from 'vue'

export default {
  name: 'HelpPage',
  setup() {
    onMounted(() => {
      // Initialize Bootstrap tabs manually
      const tabButtons = document.querySelectorAll('#v-pills-tab button[data-bs-toggle="pill"]')
      
      tabButtons.forEach(button => {
        button.addEventListener('click', (e) => {
          e.preventDefault()
          
          // Remove active class from all tabs and content
          tabButtons.forEach(btn => btn.classList.remove('active'))
          document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.remove('show', 'active')
          })
          
          // Add active class to clicked tab
          button.classList.add('active')
          
          // Show corresponding content
          const target = button.getAttribute('data-bs-target')
          const targetPane = document.querySelector(target)
          if (targetPane) {
            targetPane.classList.add('show', 'active')
          }
        })
      })
    })
  }
}
</script>

<style scoped>
.nav-pills .nav-link {
  text-align: left;
  margin-bottom: 0.25rem;
}

.tab-content {
  min-height: 600px;
}

h4 {
  margin-bottom: 1rem;
}

h5 {
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
}

ul, ol {
  margin-bottom: 1rem;
}

li {
  margin-bottom: 0.25rem;
}
</style>