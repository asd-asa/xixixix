<template>
  <div class="admin-wallpapers">
    <div class="page-header">
      <h2>壁纸审核</h2>
    </div>

    <div class="toolbar">
      <el-input v-model="titleQuery" placeholder="按标题搜索" clearable style="width:240px" @keyup.enter="handleSearch" />
      <el-input v-model="tagQuery" placeholder="按标签搜索" clearable style="width:240px" @keyup.enter="handleSearch" />
      <el-button type="primary" @click="handleSearch">搜索</el-button>
      <el-button @click="resetSearch">重置</el-button>
      <el-button :disabled="selectedAuditWallpapers.length === 0" type="success" @click="batchReviewWallpapers('approved')">批量通过</el-button>
      <el-button :disabled="selectedAuditWallpapers.length === 0" type="warning" @click="batchReviewWallpapers('rejected')">批量驳回</el-button>
    </div>

    <el-table :data="pendingWallpapers" @selection-change="handleSelectionChange" v-loading="loading">
      <el-table-column type="selection" width="55" />
      <el-table-column prop="title" label="标题" />
      <el-table-column label="标签" min-width="180">
        <template #default="{ row }">
          <div class="PopupTags">
            <span v-for="(tag, index) in parseTags(row.tags)" :key="index">
              {{ tag }}
            </span>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="userrole" label="上传者" width="140" />
      <el-table-column prop="category" label="分类" width="120" />
      <el-table-column label="当前状态" width="140">
        <template #default="{ row }">
          {{ statusLabel(row.status) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="220">
        <template #default="{row}">
          <el-button size="small" @click="viewWallpaper(row)">预览</el-button>
          <el-button size="small" type="success" @click="reviewWallpaperRow(row, 'approved')">通过</el-button>
          <el-button size="small" type="warning" @click="reviewWallpaperRow(row, 'rejected')">驳回</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-wrap">
      <el-pagination
        background
        layout="prev, pager, next"
        :current-page="auditPage"
        :page-size="auditPageSize"
        :total="auditTotal"
        @current-change="handleCurrentChange"
      />
    </div>

    <el-image-viewer
      v-if="showPreview"
      :url-list="[previewImage]"
      @close="showPreview = false"
      show-progress
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getPendingWallpapers, reviewWallpaper as apiReviewWallpaper } from '@/api/wallpapers.js'

const router = useRouter()

const titleQuery = ref('')
const tagQuery = ref('')
const pendingWallpapers = ref([])
const selectedAuditWallpapers = ref([])
const auditPage = ref(1)
const auditPageSize = ref(10)
const auditTotal = ref(0)
const loading = ref(false)
const showPreview = ref(false)
const previewImage = ref('')

const STATUS_MAP = {
  pending: '待审核',
  approved: '已通过',
  rejected: '已拒绝'
}

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

const parseTags = (tags) => {
  if (!tags) return []
  if (Array.isArray(tags)) return tags
  try {
    if (typeof tags === 'string') {
      const s = tags.trim()
      if (s.startsWith('[') && s.endsWith(']')) {
        const parsed = JSON.parse(s)
        return Array.isArray(parsed) ? parsed : [String(parsed)]
      }
      return s.split(',').map(t => t.trim()).filter(Boolean)
    }
    return [String(tags)]
  } catch (e) {
    return String(tags).split(',').map(t => t.trim()).filter(Boolean)
  }
}

const statusLabel = (val) => STATUS_MAP[String(val || '').toLowerCase()] || String(val || '')

const normalizeList = (res) => {
  if (!res) return []
  if (Array.isArray(res)) return res
  return res.results || res.data || []
}

const fetchList = async (p = auditPage.value) => {
  loading.value = true
  try {
    const res = await getPendingWallpapers(p, auditPageSize.value, titleQuery.value.trim(), tagQuery.value.trim())
    pendingWallpapers.value = normalizeList(res)
    auditPage.value = res.page || res.pagination?.page || p
    auditPageSize.value = res.pageSize || res.pagination?.pageSize || auditPageSize.value
    auditTotal.value = res.count || res.pagination?.total || res.pagination?.total_count || 0
  } catch (e) {
    console.warn('fetchPendingFromServer failed', e)
    pendingWallpapers.value = []
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  auditPage.value = 1
  fetchList(1)
}

const resetSearch = () => {
  titleQuery.value = ''
  tagQuery.value = ''
  auditPage.value = 1
  fetchList(1)
}

const handleCurrentChange = (p) => fetchList(Number(p))

const handleSelectionChange = (rows) => {
  selectedAuditWallpapers.value = Array.isArray(rows) ? rows : []
}

const batchReviewWallpapers = async (status) => {
  if (!selectedAuditWallpapers.value.length) {
    ElMessage.warning('请先选择要审核的壁纸')
    return
  }

  const actionLabel = status === 'approved' ? '通过' : '驳回'
  try {
    await ElMessageBox.confirm(
      `确认批量${actionLabel}选中的 ${selectedAuditWallpapers.value.length} 张壁纸吗？`,
      '提示',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await Promise.all(
      selectedAuditWallpapers.value.map((row) =>
        apiReviewWallpaper(row.id, {
          action: status === 'approved' ? 'approve' : 'reject',
          status
        })
      )
    )

    ElMessage.success(`批量${actionLabel}成功`)
    selectedAuditWallpapers.value = []
    fetchList(auditPage.value)
  } catch (e) {
    if (e === 'cancel' || e === 'close') return
    console.error(`批量${actionLabel}失败`, e)
    ElMessage.error(`批量${actionLabel}失败`)
  }
}

const reviewWallpaperRow = async (row, status) => {
  try {
    await apiReviewWallpaper(row.id, {
      action: status === 'approved' ? 'approve' : 'reject',
      status
    })
    ElMessage.success(status === 'approved' ? '审核通过' : '已驳回')
    fetchList(auditPage.value)
  } catch (e) {
    console.error('审核失败', e)
    ElMessage.error('审核失败')
  }
}

const viewWallpaper = (row) => {
  previewImage.value = row.image || row.url || row.image_url || row.original || ''
  showPreview.value = true
}

onMounted(() => {
  if (!isAdminUser()) {
    router.replace('/')
    return
  }
  fetchList()
})
</script>

<style scoped>
.admin-wallpapers {
  border-radius: 10px;
  background: rgba(44, 100, 146, 0.5);
  margin-top: 20px;
  width: 90%;
  min-height: 60vh;
  margin: 30px auto 0;
  box-sizing: border-box;
  padding: 8px;
}

h2 { margin: 0; color: #fff }

.page-header,
.toolbar,
.pagination-wrap {
  display: flex;
  align-items: center;
}

.page-header {
  justify-content: space-between;
  margin-bottom: 12px;
}

.toolbar {
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.pagination-wrap {
  margin-top: 12px;
  justify-content: flex-end;
}

:deep(.el-table .cell) { color: #fff; }
:deep(.el-table thead th .cell) { color: #9be7b1; }
:deep(.el-table tr) { background-color: transparent !important; }
:deep(.el-input__wrapper .el-input__inner::placeholder) { color: #fff; }
:deep(.el-tabs__item) { color: #fff; }
:deep(.el-tabs__item.is-active) { color: #409EFF; }

.PopupTags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.PopupTags span {
  display: inline-block;
  background: rgba(255,255,255,0.08);
  color: #fff;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
}
</style>