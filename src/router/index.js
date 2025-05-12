// createMemoryHistory 通常用于服务端渲染（SSR）或测试环境。
// 如果你在浏览器环境中使用它，可能会导致问题。
import { createWebHistory, createRouter } from 'vue-router'

import Layout from '@/views/Layout/index.vue'
import Login from '@/views/login.vue'
import Like from '@/views/like/index.vue'
import Phone from '@/views/phone/index.vue'
import Setting from '@/views/setting/index.vue'
import About from '@/views/about/index.vue'
import My from '@/views/my/index.vue'
import Register from '@/views/Register/index.vue'
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
      path: '/phone',
      component: Phone,
    },
    {
      path: '/about',
      component: About,
    },
    {
      path: '/setting',
      component: Setting,
    },
    {
      path: '/my',
      component: My,
    },
    {
      path: '/register',
      component: Register,
    },

  ]
})

export default router