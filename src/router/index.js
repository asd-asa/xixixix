// createMemoryHistory 通常用于服务端渲染（SSR）或测试环境。
// 如果你在浏览器环境中使用它，可能会导致问题。
import { createWebHistory, createRouter } from 'vue-router'

import Layout from '@/views/Layout/index.vue'
import Login from '@/views/login.vue'
import Like from '@/views/like/index.vue'
import Search from '@/views/search/index.vue'
import Setting from '@/views/setting/index.vue'
import About from '@/views/about/index.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: Layout,
    },
    {
      path: '/login',
      component: Login
    },
    {
      path: '/like',
      component: Like,
    },
    {
      path: '/search',
      component: Search,
    },
    {
      path: '/about',
      component: About,
    },
    {
      path: '/setting',
      component: Setting,
    }
  ]
})

export default router