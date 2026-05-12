<template>
  <div class="admin-dashboard">
    <el-row :gutter="16">
      <el-col :span="6">
        <el-card>
          <div class="stat-title">壁纸总数</div>
          <div class="stat-value">{{ totalWallpapers }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <div class="stat-title">待审核数</div>
          <div class="stat-value">{{ pending }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <div class="stat-title">注册用户数</div>
          <div class="stat-value">{{ totalUsers }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <div class="stat-title">今日上传</div>
          <div class="stat-value">{{ todayUploads }}</div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getWallpapersPage, getPendingWallpapers } from '@/api/wallpapers.js'
import { listUsers } from '@/api/user.js'

const router = useRouter()

const todayUploads = ref(0)
const totalWallpapers = ref('-')
const totalUsers = ref('-')
const pending = ref('-')


const isAdminUser = () => {
  try {
    const userStr = (typeof window !== 'undefined') ? localStorage.getItem('user') : null;
    if (userStr) {
      const u = JSON.parse(userStr || 'null');
      const r = (u && (u.role || u.username)) || (typeof window !== 'undefined' ? localStorage.getItem('role') || localStorage.getItem('username') : '');
      return String(r || '').trim().toLowerCase() === 'admin';
    }
    const role = (typeof window !== 'undefined' ? (localStorage.getItem('role') || localStorage.getItem('username') || '') : '');
    return String(role).trim().toLowerCase() === 'admin';
  } catch (e) {
    return false;
  }
};

const fetchStats = async () => {
  try {
    const w = await getWallpapersPage('', 1, 1)
    totalWallpapers.value = w.count || (w.pagination && (w.pagination.total || w.pagination.total_count)) || '-'
  } catch (e) {
    totalWallpapers.value = '-'
  }
  try {
    const u = await listUsers({ page: 1, pageSize: 1 })
    totalUsers.value = u.pagination?.total || u.count || '-' 
  } catch (e) {
    totalUsers.value = '-'
  }

  try {
    const p = await getPendingWallpapers(1, 1)
    pending.value = p.count || (p.pagination && (p.pagination.total || p.pagination.total_count)) || '-'
  } catch (e) {
    pending.value = '-'
  }

  try {
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
    const wAll = await getWallpapersPage('', 1, 100)
    const items = wAll.results || []
    todayUploads.value = items.filter((item) => {
      const createdAt = item.created_at || item.createdAt || item.add_time || item.addTime
      if (!createdAt) return false
      const time = new Date(createdAt).getTime()
      return !Number.isNaN(time) && time >= startOfDay
    }).length
  } catch (e) {
    todayUploads.value = '-'
  }
}

onMounted(()=>{
  if (!isAdminUser()) {
    router.replace('/');
    return;
  }
  fetchStats()
})
</script>

<style scoped>
.admin-dashboard {
  border-radius: 17px;
  background: rgba(44, 100, 146, 0.5) !important;
  margin-top: 20px;
  width: 90%;
  min-height: 60vh;
  margin: 30px auto 0;
  box-sizing: border-box;
  padding: 8px;
  border-radius: 6px;
  scrollbar-width: thin;
  scrollbar-color: rgba(165, 149, 223, 0.5) transparent;
  transition: width 240ms ease, padding 200ms ease;
}

.stat-title{ color:#fff; font-size:14px }
.stat-value{ font-size:28px; margin-top:8px; color:#fff }
.chart-title{ margin-bottom:12px; color:#fff }

:deep(.el-card) {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.2);
}
:deep(.el-card__body) {
  color: #fff;
}
</style>
