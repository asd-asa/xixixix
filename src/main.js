import './assets/main.css'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import '@/styles/common.scss'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import { lazyPlugin } from '@/utils/lazy';
// 引入echarts
import Echarts from 'vue-echarts'
import * as echarts from 'echarts'



// createApp(App).mount('#app')
const app = createApp(App)
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component)
  }
// 使用组件
app.component('e-charts', Echarts)
// 全局挂载 echarts
app.config.globalProperties.$echarts = echarts

app.use(router)
app.use(lazyPlugin);
app.mount('#app')