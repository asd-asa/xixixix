<template>
  <div class="history-list-base">
    <div class="upload-wallpapers__title">{{ mediaType === 'computer' ? '电脑壁纸历史' : mediaType === 'mobile' ? '手机壁纸历史' : '头像历史' }}</div>
    <div class="search-bar">
      <el-input
        v-model="searchTitle"
        placeholder="按标题搜索"
        clearable
        class="search-input"
        @keyup.enter="handleSearch"
      />
      <el-input
        v-model="searchTags"
        placeholder="按标签搜索"
        clearable
        class="search-input"
        @keyup.enter="handleSearch"
      />
      <el-button type="primary" @click="handleSearch">搜索</el-button>
      <el-button @click="handleReset">重置</el-button>
    </div>
    <el-table :data="list" style="width:100%">
      <el-table-column type="index" label="序号" width="80" />
      <el-table-column label="标题" min-width="220">
        <template #default="{ row }">
          {{ getTitle(row) }}
        </template>
      </el-table-column>
      <el-table-column label="缩略图" width="160">
        <template #default="{ row }">
          <img
            :src="getWallpaper(row).image_url || getWallpaper(row).image"
            :alt="getWallpaper(row).title || '壁纸'"
            class="thumb"
            @click="openPreview(row)"
          />
        </template>
      </el-table-column>
      <el-table-column label="标签" min-width="180">
        <template #default="{ row }">
          {{ formatTags(getWallpaper(row).tags) || '无' }}
        </template>
      </el-table-column>
      <el-table-column label="时间" width="180">
        <template #default="{ row }">
          {{ formatTime(row.created_at || row.createdAt || row.viewed_at) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="220">
        <template #default="{ row }">
          <div class="actions">
            <el-button size="default" type="primary" @click="downloadWallpaper(row)">下载</el-button>
            <!-- <el-button size="default" type="danger" @click="remove(row.id)">删除</el-button> -->
          </div>
        </template>
      </el-table-column>
    </el-table>

    <div class="pager-wrap">
      <el-pagination
        background
        layout="prev, pager, next"
        :current-page="page"
        :page-size="pageSize"
        :total="total"
        @current-change="handleCurrentChange"
      />
    </div>

    <div v-if="showPreview" class="PreviewOverlay">
      <el-image-viewer
        v-if="showPreview"
        :url-list="previewList"
        @close="showPreview = false"
        show-progress
      />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getDownloadHistory, deleteDownloadHistory } from '@/api/wallpapers'
import { downloadWallpapers } from '@/api/wallpapers'
import { ensureAuthenticated } from '@/utils/auth.js'

const props = defineProps({
  mediaType: { type: String, required: true }
})

const list = ref([])
const page = ref(1)
const pageSize = ref(5)
const total = ref(0)
const showPreview = ref(false)
const previewList = ref([])
const searchTitle = ref('')
const searchTags = ref('')

const normalize = (res) => {
  const rows = res?.results || res?.data || res || []
  list.value = Array.isArray(rows) ? rows : []
  total.value = res?.total || res?.count || res?.pagination?.total || 0
}

const load = async (p = page.value, title = searchTitle.value, tags = searchTags.value) => {
  try {
    const res = await getDownloadHistory(p, pageSize.value, props.mediaType, title, tags)
    normalize(res)
    page.value = p
  } catch (error) {
    console.error('获取历史失败', error)
    ElMessage.error('获取历史失败')
  }
}

const handleCurrentChange = (p) => { load(Number(p)) }

const handleSearch = () => {
  page.value = 1
  load(1, searchTitle.value.trim(), searchTags.value.trim())
}

const handleReset = () => {
  searchTitle.value = ''
  searchTags.value = ''
  page.value = 1
  load(1, '', '')
}

const getWallpaper = (row) => row?.wallpaper || row
const getTitle = (row) => getWallpaper(row)?.title || row?.title || row?.wallpaper_title || '未命名'

const openPreview = (row) => {
  const wallpaper = getWallpaper(row)
  const url = wallpaper.image || wallpaper.image_url
  if (!url) { ElMessage.error('图片地址为空，无法预览'); return }
  previewList.value = [url]
  showPreview.value = true
}

const formatTags = (tags) => {
  try { if (!tags) return ''; if (Array.isArray(tags)) return tags.join('、'); const parsed = JSON.parse(tags||'[]'); return Array.isArray(parsed)? parsed.join('、'): String(tags) } catch(e){ return String(tags||'') }

}

const formatTime = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  const pad = (n) => String(n).padStart(2,'0')
  return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

const downloadWallpaper = async (row) => {
  if (!ensureAuthenticated()) return
  const wallpaper = getWallpaper(row)
  const url = wallpaper.image || wallpaper.image_url
  if (!url) { ElMessage.error('图片地址为空，无法下载'); return }
  try {
    const resp = await fetch(url)
    if (!resp.ok) throw new Error('HTTP 错误')
    const blob = await resp.blob()
    const blobUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = blobUrl
    link.download = (wallpaper.title || '').replace(/[\\/:*?"<>|]/g,'-') || String(Date.now())
    document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(blobUrl)
    if (wallpaper?.id) void downloadWallpapers(wallpaper.id).catch(()=>{})
    ElMessage.success('下载成功')
  } catch (e) { console.error('下载失败', e); ElMessage.error('下载失败') }
}

const remove = async (id) => {
  if (!ensureAuthenticated()) return
  try {
    await deleteDownloadHistory(id)
    ElMessage.success('删除成功')
    load()
  } catch (e) { console.error('删除历史失败', e); ElMessage.error('删除失败') }
}

load()
</script>

<style scoped>
.history-list-base { width:100% }
.search-bar {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
  margin: 0 0 16px;
}
.search-input {
  width: 220px;
}
.thumb { width:120px; height:80px; object-fit:cover; cursor:pointer }
.pager-wrap{ margin-top:12px; display:flex; justify-content:flex-end }
.actions { display:flex; gap:10px }
.upload-wallpapers__title{ font-size:20px; color:#fff; text-align:center; margin-bottom:16px }
</style>
