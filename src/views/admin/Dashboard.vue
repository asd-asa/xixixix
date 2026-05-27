<template>
  <div class="admin-dashboard">
    <el-row :gutter="16" class="stats-grid">
      <el-col :xs="12" :sm="12" :md="6">
        <el-card>
          <div class="stat-title">壁纸总数</div>
          <div class="stat-value">{{ totalWallpapers }}</div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="12" :md="6">
        <el-card>
          <div class="stat-title">待审核数</div>
          <div class="stat-value">{{ pending }}</div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="12" :md="6">
        <el-card>
          <div class="stat-title">注册用户数</div>
          <div class="stat-value">{{ totalUsers }}</div>
        </el-card>
      </el-col>
      <!-- <el-col :xs="12" :sm="12" :md="6">
        <el-card>
          <div class="stat-title">今日上传</div>
          <div class="stat-value">{{ todayUploads }}</div>
        </el-card>
      </el-col> -->
    </el-row>
    <el-card class="chart-card">
      <div class="chart-title">壁纸类型数量统计</div>
      <div ref="chartRef" class="chart-box"></div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'
import { getWallpapersPage, getPendingWallpapers } from '@/api/wallpapers.js'
import { listUsers } from '@/api/user.js'

const router = useRouter()

const todayUploads = ref(0)
const totalWallpapers = ref('-')
const totalUsers = ref('-')
const pending = ref('-')
const chartRef = ref(null)
let chartInstance = null

const wallpaperTypeCounts = ref([
  { name: '头像', value: 0 },
  { name: '手机', value: 0 },
  { name: '电脑', value: 0 }
])


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

const extractTotal = (res) => {
  if (!res) return '-'
  return res.count || res.pagination?.total || res.pagination?.total_count || (Array.isArray(res.results) ? res.results.length : '-')
}

const fetchMediaTypeCount = async (mediaType) => {
  try {
    const res = await getWallpapersPage('', 1, 1, '', '', mediaType, '')
    return Number(extractTotal(res)) || 0
  } catch (e) {
    return 0
  }
}

const renderChart = () => {
  if (!chartRef.value) return
  if (!chartInstance) {
    chartInstance = echarts.init(chartRef.value)
  }

  chartInstance.setOption({
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis'
    },
    grid: {
      left: 12,
      right: 12,
      top: 40,
      bottom: 24,
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: wallpaperTypeCounts.value.map((item) => item.name),
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.45)' } },
      axisLabel: { color: '#fff' }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.12)' } },
      axisLabel: { color: '#fff' }
    },
    series: [{
      name: '数量',
      type: 'line',
      smooth: true,
      data: wallpaperTypeCounts.value.map((item) => item.value),
      symbolSize: 10,
      lineStyle: {
        width: 3,
        color: '#8fd3ff'
      },
      itemStyle: {
        color: '#8fd3ff'
      },
      areaStyle: {
        color: 'rgba(143, 211, 255, 0.18)'
      }
    }]
  })
}

const updateChart = async () => {
  wallpaperTypeCounts.value = [
    { name: '头像', value: await fetchMediaTypeCount('avatar') },
    { name: '手机', value: await fetchMediaTypeCount('mobile') },
    { name: '电脑', value: await fetchMediaTypeCount('computer') }
  ]
  await nextTick()
  renderChart()
}

const fetchStats = async () => {
  try {
    const w = await getWallpapersPage('', 1, 1)
    totalWallpapers.value = w.count || (w.pagination && (w.pagination.total || w.pagination.total_count)) || '-'
  } catch (e) {
    totalWallpapers.value = '-'
  }
  try {
    const u = await listUsers({ page: 1, pageSize: 500 })
    totalUsers.value = u.pagination?.total_count || '-' 
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

  await updateChart()
}

onMounted(()=>{
  if (!isAdminUser()) {
    router.replace('/');
    return;
  }
  fetchStats()
  window.addEventListener('resize', resizeChart)
})

const resizeChart = () => {
  if (chartInstance) {
    chartInstance.resize()
  }
}

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeChart)
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
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

.stats-grid {
  margin-bottom: 16px;
}

.chart-card {
  background: rgba(255, 255, 255, 0.06);
}

.chart-box {
  width: 100%;
  height: 320px;
}

.stat-title{ color:#fff; font-size:14px }
.stat-value{ font-size:28px; margin-top:8px; color:#fff }
.chart-title{ margin-bottom:12px; color:#fff; font-size:16px; font-weight:600 }

:deep(.el-card) {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.2);
}
:deep(.el-card__body) {
  color: #fff;
}
</style>
