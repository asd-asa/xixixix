// createMemoryHistory 通常用于服务端渲染（SSR）或测试环境。
// 如果你在浏览器环境中使用它，可能会导致问题。
import { createWebHistory, createRouter } from 'vue-router'

import Layout from '@/views/Layout/index.vue'
import Login from '@/views/login.vue'
import Like from '@/views/like/index.vue'
import Phone from '@/views/phone/index.vue'
import Avatar from '@/views/avatar/index.vue'
import My from '@/views/my/index.vue'
import Register from '@/views/Register/index.vue'
import ForgotPassword from '@/views/ForgotPassword/index.vue'
import MyUpload from '@/views/my/components/upload.vue'
import MyFavorites from '@/views/my/components/Favorites.vue'
import ComputerFavorites from '@/views/my/components/Favorites/ComputerFavorites.vue'
import MobileFavorites from '@/views/my/components/Favorites/MobileFavorites.vue'
import AvatarFavorites from '@/views/my/components/Favorites/AvatarFavorites.vue'
import MyProfile from '@/views/my/components/profile.vue'
import MyHistory from '@/views/my/components/history.vue'
import ComputerHistory from '@/views/my/components/history/ComputerHistory.vue'
import MobileHistory from '@/views/my/components/history/MobileHistory.vue'
import AvatarHistory from '@/views/my/components/history/AvatarHistory.vue'
import MyInfo from '@/views/my/components/info.vue'
import AdminLayout from '@/views/admin/Layout.vue'
import AdminDashboard from '@/views/admin/Dashboard.vue'
import AdminWallpapersComputer from '@/views/admin/WallpapersComputer.vue'
import AdminWallpapersPhone from '@/views/admin/WallpapersPhone.vue'
import AdminWallpapersAvatar from '@/views/admin/WallpapersAvatar.vue'
import AdminWallpapersAudit from '@/views/admin/WallpapersAudit.vue'
import AdminUsers from '@/views/admin/Users.vue'
import AdminCategories from '@/views/admin/Categories.vue'
import AdminTags from '@/views/admin/Tags.vue'
const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: Layout,
    },
    {
      path: '/admin',
      component: AdminLayout,
      children: [
        { path: 'dashboard', component: AdminDashboard },
        // { path: 'wallpapers', redirect: '/admin/wallpapers/edit/computer' },
        // { path: 'wallpapers/edit', redirect: '/admin/wallpapers/edit/computer' },
        { path: 'wallpapers/edit/computer', component: AdminWallpapersComputer },
        { path: 'wallpapers/edit/phone', component: AdminWallpapersPhone },
        { path: 'wallpapers/edit/avatar', component: AdminWallpapersAvatar },
        { path: 'wallpapers/audit', component: AdminWallpapersAudit },
        { path: 'users', component: AdminUsers },
        { path: 'categories', component: AdminCategories },
        { path: 'tags', component: AdminTags },
        { path: '', redirect: '/admin/dashboard' }
      ]
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
      path: '/avatar',
      component: Avatar,
    },
    {
      path: '/my',
      component: My,
      children: [
        { path: 'components/upload', component: MyUpload },
        {
          path: 'components/favorites',
          component: MyFavorites,
          children: [
            { path: 'computer', component: ComputerFavorites },
            { path: 'mobile', component: MobileFavorites },
            { path: 'avatar', component: AvatarFavorites },
            { path: '', redirect: '/my/components/favorites/computer' }
          ]
        },
        { path: 'components/profile', component: MyProfile },
        { path: 'components/history', component: MyHistory },
        {
          path: 'components/history',
          component: MyHistory,
          children: [
            { path: 'computer', component: ComputerHistory },
            { path: 'mobile', component: MobileHistory },
            { path: 'avatar', component: AvatarHistory },
            { path: '', redirect: '/my/components/history/computer' }
          ]
        },
        { path: 'components/info', component: MyInfo },

        { path: '', redirect: '/my/components/upload' }
      ]
    },
    {
      path: '/register',
      component: Register,
    },
    {
      path: '/forgot-password',
      component: ForgotPassword,
    },

  ]
})

export default router