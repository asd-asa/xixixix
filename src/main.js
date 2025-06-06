import './assets/main.css'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import '@/styles/common.scss'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import { lazyPlugin } from '@/utils/lazy';


// createApp(App).mount('#app')
const app = createApp(App)
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component)
  }
app.use(router)
app.use(lazyPlugin);
app.mount('#app')