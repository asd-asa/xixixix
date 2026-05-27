<template>
  <div class="admin-wallpapers">
    <div class="page-header">
      <h2>壁纸编辑</h2>
    </div>

    <div class="toolbar">
      <el-input v-model="titleQuery" placeholder="按标题搜索" clearable style="width:240px" @keyup.enter="handleSearch" />
      <el-input v-model="tagQuery" placeholder="按标签搜索" clearable style="width:240px" @keyup.enter="handleSearch" />
      <el-button type="primary" @click="handleSearch">搜索</el-button>
      <el-button @click="resetSearch">重置</el-button>
      <el-button :disabled="selectedWallpapers.length === 0" type="danger" @click="deleteSelectedWallpapers">批量删除</el-button>
    </div>

    <el-table :data="wallpapers" @selection-change="handleSelectionChange" v-loading="loading">
      <el-table-column type="selection" width="55" />
      <el-table-column prop="title" label="标题" />
      <el-table-column prop="userrole" label="上传者" width="140" />
      <el-table-column prop="category" label="分类" width="120" />
      <el-table-column label="标签" min-width="180">
        <template #default="{ row }">
          <div class="PopupTags">
            <span v-for="(tag, index) in parseTags(row.tags)" :key="index">
              {{ tag }}
            </span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="250">
        <template #default="{row}">
          <el-button size="small" @click="openEditDialog(row)">编辑</el-button>
          <el-button size="small" @click="viewWallpaper(row)">预览</el-button>
          <el-button size="small" type="danger" @click="removeWallpaper(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-wrap">
      <el-pagination
        background
        layout="prev, pager, next"
        :current-page="editPage"
        :page-size="editPageSize"
        :total="editTotal"
        @current-change="handleEditCurrentChange"
      />
    </div>

    <el-image-viewer
      v-if="showPreview"
      :url-list="[previewImage]"
      @close="showPreview = false"
      show-progress
    />

    <el-dialog v-model="editDialogVisible" title="编辑壁纸" width="560px">
      <el-form :model="editForm" label-width="90px">
        <el-form-item label="标题">
          <el-input v-model="editForm.title" />
        </el-form-item>
        <el-form-item label="图片预览">
          <div class="image-picker" @click="triggerImagePick">
            <el-image
              v-if="editForm.image"
              :src="editForm.image"
              fit="cover"
              class="image-picker__preview"
            />
            <div v-else class="image-picker__empty">点击选择图片</div>
            <div class="image-picker__mask">点击更换</div>
          </div>
          <input
            ref="imageInputRef"
            type="file"
            accept="image/*"
            style="display: none"
            @change="handleImageChange"
          />
        </el-form-item>
        <el-form-item label="分类">
          <el-input v-model="editForm.category" />
        </el-form-item>
        <el-form-item label="图片标签">
          <el-select
            v-model="editForm.tags"
            multiple
            filterable
            allow-create
            default-first-option
            :reserve-keyword="false"
            placeholder="请输入图片标签或选择已有标签"
            style="width: 100%;"
          >
            <el-option
              v-for="item in classifyTags"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveWallpaperEdit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getWallpapersPage, deleteWallpapers, editWallpaper } from '@/api/wallpapers.js'

const router = useRouter()

const titleQuery = ref('')
const tagQuery = ref('')
const wallpapers = ref([])
const selectedWallpapers = ref([])
const editPage = ref(1)
const editPageSize = ref(10)
const editTotal = ref(0)
const loading = ref(false)
const editDialogVisible = ref(false)
const imageInputRef = ref(null)
const editImageFile = ref(null)
const editImagePreviewUrl = ref('')
const editForm = ref({
  id: null,
  title: '',
  image: '',
  category: '',
  tags: []
})

const classifyTags = ref([])
const showPreview = ref(false)
const previewImage = ref('')

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

const normalizeList = (res) => {
  if (!res) return []
  if (Array.isArray(res)) return res
  return res.results || res.data || res.items || []
}

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

const refreshClassifyTags = (items = []) => {
  const uniqueTags = new Set()
  items.forEach((item) => {
    parseTags(item.tags).forEach((tag) => {
      if (tag) uniqueTags.add(String(tag))
    })
  })
  classifyTags.value = Array.from(uniqueTags).map((tag) => ({ label: tag, value: tag }))
}

const fetchList = async (p = editPage.value) => {
  loading.value = true
  try {
    const res = await getWallpapersPage('', p, editPageSize.value, '', tagQuery.value.trim(), '', titleQuery.value.trim())
    wallpapers.value = res.results || []
    refreshClassifyTags(wallpapers.value)
    editPage.value = res.page || res.pagination?.page || p
    editPageSize.value = res.pageSize || res.pagination?.pageSize || editPageSize.value
    editTotal.value = res.count || res.pagination?.total || res.pagination?.total_count || 0
  } catch (e) {
    console.error('获取壁纸列表失败', e)
    ElMessage.error('获取壁纸列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  editPage.value = 1
  fetchList(1)
}

const resetSearch = () => {
  titleQuery.value = ''
  tagQuery.value = ''
  editPage.value = 1
  fetchList(1)
}

const handleEditCurrentChange = (p) => { fetchList(Number(p)) }

const handleSelectionChange = (rows) => {
  selectedWallpapers.value = Array.isArray(rows) ? rows : []
}

const deleteSelectedWallpapers = async () => {
  if (!selectedWallpapers.value.length) {
    ElMessage.warning('请先选择要删除的壁纸')
    return
  }

  try {
    await ElMessageBox.confirm(`确认删除选中的 ${selectedWallpapers.value.length} 张壁纸吗？`, '提示', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await Promise.all(selectedWallpapers.value.map((row) => deleteWallpapers(row.id)))
    ElMessage.success('批量删除成功')
    selectedWallpapers.value = []
    fetchList(editPage.value)
  } catch (e) {
    if (e === 'cancel' || e === 'close') return
    console.error('批量删除失败', e)
    ElMessage.error('批量删除失败')
  }
}

const viewWallpaper = (row) => {
  const url = row.image || row.url || row.image_url || row.original || ''
  previewImage.value = url
  showPreview.value = true
}

const openEditDialog = (row) => {
  if (editImagePreviewUrl.value) {
    URL.revokeObjectURL(editImagePreviewUrl.value)
    editImagePreviewUrl.value = ''
  }
  editImageFile.value = null
  editForm.value = {
    id: row.id,
    title: row.title || '',
    image: row.image || row.image_url || row.url || row.original || '',
    category: row.category || '',
    tags: parseTags(row.tags)
  }
  editDialogVisible.value = true
}

const triggerImagePick = () => {
  imageInputRef.value?.click()
}

const handleImageChange = (event) => {
  const file = event?.target?.files?.[0]
  if (!file) return
  if (!file.type || !file.type.startsWith('image/')) {
    ElMessage.warning('请选择图片文件')
    event.target.value = ''
    return
  }

  if (editImagePreviewUrl.value) {
    URL.revokeObjectURL(editImagePreviewUrl.value)
  }

  editImageFile.value = file
  editImagePreviewUrl.value = URL.createObjectURL(file)
  editForm.value.image = editImagePreviewUrl.value
  event.target.value = ''
}

const saveWallpaperEdit = async () => {
  try {
    const tagsForSend = Array.isArray(editForm.value.tags) ? editForm.value.tags : parseTags(editForm.value.tags)
    const formData = new FormData()
    formData.append('title', editForm.value.title || '')
    formData.append('category', editForm.value.category || '')
    formData.append('tags', JSON.stringify(tagsForSend))
    if (editImageFile.value) {
      formData.append('image', editImageFile.value)
    }

     await editWallpaper(editForm.value.id, formData)

    ElMessage.success('已保存')
    editDialogVisible.value = false
    if (editImagePreviewUrl.value) {
      URL.revokeObjectURL(editImagePreviewUrl.value)
      editImagePreviewUrl.value = ''
    }
    editImageFile.value = null
    fetchList(editPage.value)
  } catch (e) {
    console.error('上传图片类型与当前壁纸类型不匹配', e)
  }
}

const removeWallpaper = async (row) => {
  try {
    await ElMessageBox.confirm(`确认删除壁纸「${row.title || '-'}」吗？`, '提示', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await deleteWallpapers(row.id)
    ElMessage.success('删除成功')
    fetchList(editPage.value)
  } catch (e) {
    if (e === 'cancel' || e === 'close') return
    console.error('删除失败', e)
    ElMessage.error('删除失败')
  }
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

.image-picker {
  position: relative;
  width: 160px;
  height: 100px;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  border: 1px dashed rgba(255, 255, 255, 0.35);
  background: rgba(255, 255, 255, 0.06);
}

.image-picker__preview {
  width: 100%;
  height: 100%;
  display: block;
}

.image-picker__empty {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.75);
  font-size: 14px;
}

.image-picker__mask {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 13px;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.08), rgba(0, 0, 0, 0.42));
  opacity: 0;
  transition: opacity 160ms ease;
}

.image-picker:hover .image-picker__mask {
  opacity: 1;
}
</style>