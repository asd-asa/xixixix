<template>
  <div class="favorite-list-base">
    <div class="upload-wallpapers__title">{{ mediaType === 'computer' ? '电脑壁纸收藏' : mediaType === 'mobile' ? '手机壁纸收藏' : '头像收藏' }}</div>
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
      <el-table-column label="标题" min-width="180">
        <template #default="{ row }">
          {{ getWallpaper(row).title || '未命名' }}
        </template>
      </el-table-column>
      <el-table-column label="缩略图" width="160">
        <template #default="{ row }">
          <img
            :src="getWallpaper(row).image_url || getWallpaper(row).image"
            :alt="getWallpaper(row).title || '收藏壁纸'"
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
      <el-table-column label="操作" width="220">
        <template #default="{ row }">
          <div class="actions">
            <el-button size="default" type="primary" @click="downloadWallpaper(row)">
              下载
            </el-button>
            <el-button size="default" type="danger" @click="remove(getWallpaperId(row))">
              取消收藏
            </el-button>
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
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { getFavorites, removeFavorite } from '@/api/user.js'
import { downloadWallpapers } from '@/api/wallpapers'
import { ensureAuthenticated } from '@/utils/auth.js'

const props = defineProps({
  mediaType: {
    type: String,
    required: true,
  },
})

const list = ref([])
const page = ref(1)
const pageSize = ref(5)
const total = ref(0)
const showPreview = ref(false)
const previewList = ref([])
const searchTitle = ref('')
const searchTags = ref('')

const load = async (nextPage = page.value, nextPageSize = pageSize.value, title = searchTitle.value, tags = searchTags.value) => {
  try {
    const res = await getFavorites(nextPage, nextPageSize, props.mediaType, title, tags)
    const rows = res.data || res.results || res || []
    list.value = Array.isArray(rows) ? rows : []
    total.value = res.pagination?.total || res.count || 0
    page.value = res.pagination?.page || nextPage
  } catch (error) {
    console.error('获取收藏失败', error)
    ElMessage.error('获取收藏失败')
  }
}

const getWallpaperId = (row) => {
  return row.wallpaper_id || row.wallpaper?.id || row.wallpaper || row.id
}

const getWallpaper = (row) => {
  return row.wallpaper || row
}

const openPreview = (row) => {
  const wallpaper = getWallpaper(row)
  const url = wallpaper.image || wallpaper.image_url
  if (!url) {
    ElMessage.error('图片地址为空，无法预览')
    return
  }
  previewList.value = [url]
  showPreview.value = true
}

const getBasenameFromUrl = (u) => {
  try {
    return decodeURIComponent(String(u).split('/').pop() || '')
  } catch (error) {
    return String(u).split('/').pop() || ''
  }
}

const sanitizeFilename = (name) => {
  if (!name) return ''
  return String(name).replace(/[\\/:*?"<>|\u0000-\u001f]/g, '-').replace(/[. ]+$/g, '').slice(0, 100)
}

const downloadWallpaper = async (row) => {
  if (!ensureAuthenticated()) return;
  const wallpaper = getWallpaper(row)
  const url = wallpaper.image || wallpaper.image_url
  if (!url) {
    ElMessage.error('图片地址为空，无法下载')
    return
  }

  const title = wallpaper.title ? String(wallpaper.title).trim() : ''
  const suffix = url.includes('.') ? url.slice(url.lastIndexOf('.')) : '.jpg'
  const filenameBase = sanitizeFilename(title || getBasenameFromUrl(url).replace(/\.[^.]+$/, '')) || String(Date.now())

  try {
    const response = await fetch(url)
    if (!response.ok) throw new Error(`HTTP 错误: ${response.status}`)
    const blob = await response.blob()
    const blobUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = blobUrl
    link.download = `${filenameBase}${suffix}`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(blobUrl)

    const wallpaperId = getWallpaperId(row)
    if (wallpaperId) {
      void downloadWallpapers(wallpaperId).catch((error) => {
        console.error('下载记录上报失败', error)
      })
    }
    ElMessage.success('下载成功')
  } catch (error) {
    console.error('下载失败', error)
    ElMessage.error('下载失败')
  }
}

const remove = async (id) => {
  if (!ensureAuthenticated()) return;
  try {
    await removeFavorite(id)
    ElMessage.success('已移除')
    load()
  } catch (error) {
    console.error('移除失败', error)
    ElMessage.error('移除失败')
  }
}

const formatTags = (tags) => {
  try {
    if (!tags) return ''
    if (Array.isArray(tags)) return tags.join('、')
    const parsed = JSON.parse(tags || '[]')
    return Array.isArray(parsed) ? parsed.join('、') : String(tags)
  } catch (error) {
    return String(tags || '')
  }
}

const handleCurrentChange = (nextPage) => {
  load(Number(nextPage), pageSize.value)
}

const handleSearch = () => {
  page.value = 1
  load(1, pageSize.value, searchTitle.value.trim(), searchTags.value.trim())
}

const handleReset = () => {
  searchTitle.value = ''
  searchTags.value = ''
  page.value = 1
  load(1, pageSize.value, '', '')
}

watch(
  () => props.mediaType,
  () => {
    page.value = 1
    load(1, pageSize.value)
  },
  { immediate: true }
)
</script>

<style scoped>
.favorite-list-base {
  width: 100%;
}

.search-bar {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
  margin-bottom: 16px;
}

.search-input {
  width: 220px;
}

.actions {
  display: flex;
  gap: 10px;
  flex-wrap: nowrap;
  align-items: center;
}

.thumb {
  width: 120px;
  height: 80px;
  object-fit: cover;
  cursor: pointer;
}

.pager-wrap {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}

.PreviewOverlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}
.upload-wallpapers__title {
  font-size: 20px; /* 移动端默认字号 */
  color: #fff;
  text-align: center;
  margin-bottom: 16px;
}
</style>