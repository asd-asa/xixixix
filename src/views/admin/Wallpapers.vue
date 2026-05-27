<template>
  <div class="admin-wallpapers">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
      <h2>壁纸管理</h2>
    </div>

    <el-tabs v-model="activeTab" class="admin-tabs">
      <el-tab-pane label="壁纸编辑" name="edit">
        <div style="display:flex;gap:12px;align-items:center;margin-bottom:12px;flex-wrap:wrap;">
          <el-input v-model="titleQuery" placeholder="按标题搜索" clearable style="width:240px" @keyup.enter="handleSearch" />
          <el-input v-model="tagQuery" placeholder="按标签搜索" clearable style="width:240px" @keyup.enter="handleSearch" />
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
          <el-button :disabled="selectedWallpapers.length === 0" type="danger" @click="deleteSelectedWallpapers">批量删除</el-button>
        </div>
        <el-table :data="wallpapers" @selection-change="handleSelectionChange">
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
      </el-tab-pane>

      <el-tab-pane label="壁纸审核" name="audit">
        <div style="display:flex;gap:12px;align-items:center;margin-bottom:12px;flex-wrap:wrap;">
          <el-input v-model="titleQuery" placeholder="按标题搜索" clearable style="width:240px" @keyup.enter="handleSearchs" />
          <el-input v-model="tagQuery" placeholder="按标签搜索" clearable style="width:240px" @keyup.enter="handleSearchs" />
          <el-button type="primary" @click="handleSearchs">搜索</el-button>
          <el-button @click="resetSearchs">重置</el-button>
          <el-button :disabled="selectedAuditWallpapers.length === 0" type="success" @click="batchReviewWallpapers('approved')">批量通过</el-button>
          <el-button :disabled="selectedAuditWallpapers.length === 0" type="warning" @click="batchReviewWallpapers('rejected')">批量驳回</el-button>
        </div>
        <el-table :data="pendingWallpapers" @selection-change="handleAuditSelectionChange">
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
              <el-button size="small" type="success" @click="reviewWallpaper(row, 'approved')">通过</el-button>
              <el-button size="small" type="warning" @click="reviewWallpaper(row, 'rejected')">驳回</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <div style="margin-top:12px;display:flex;justify-content:flex-end;">
      <el-pagination
        v-if="activeTab === 'edit'"
        background
        layout="prev, pager, next"
        :current-page="editPage"
        :page-size="editPageSize"
        :total="editTotal"
        @current-change="handleEditCurrentChange"
      />
      <el-pagination
        v-else
        background
        layout="prev, pager, next"
        :current-page="auditPage"
        :page-size="auditPageSize"
        :total="auditTotal"
        @current-change="handleAuditCurrentChange"
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
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getWallpapersPage, deleteWallpapers, getPendingWallpapers, editWallpaper, reviewWallpaper as apiReviewWallpaper } from '@/api/wallpapers.js'

const router = useRouter()

const activeTab = ref('edit')
const titleQuery = ref('')
const tagQuery = ref('')
const wallpapers = ref([])
const selectedWallpapers = ref([])
const selectedAuditWallpapers = ref([])
const editPage = ref(1)
const editPageSize = ref(10)
const editTotal = ref(0)
const auditPage = ref(1)
const auditPageSize = ref(10)
const auditTotal = ref(0)
const editDialogVisible = ref(false)
const imageInputRef = ref(null)
const editImageFile = ref(null)
const editImagePreviewUrl = ref('')
const editForm = ref({
  id: null,
  title: '',
  image: '',
  category: '',
  tags: [],
  status: 'pending'
})

const pendingWallpapers = ref([])
const classifyTags = ref([])

const STATUS_MAP = {
  pending: '待审核',
  approved: '已通过',
  rejected: '已拒绝'
}

const normalizeStatus = (val) => {
  if (!val && val !== 0) return ''
  const s = String(val).trim()
  const low = s.toLowerCase()
  if (STATUS_MAP[low]) return low
  // maybe input is Chinese label
  const found = Object.entries(STATUS_MAP).find(([, label]) => String(label).trim().toLowerCase() === low)
  if (found) return found[0]
  return low
}

const statusLabel = (val) => {
  const key = normalizeStatus(val)
  return STATUS_MAP[key] || String(val || '')
}

const normalizeTags = (tags) => {
  return parseTags(tags)
}

const refreshClassifyTags = (items = []) => {
  const uniqueTags = new Set()
  items.forEach((item) => {
    normalizeTags(item.tags).forEach((tag) => {
      if (tag) uniqueTags.add(String(tag))
    })
  })
  classifyTags.value = Array.from(uniqueTags).map((tag) => ({
    label: tag,
    value: tag
  }))
}

// 使用后端提供的 pending 接口获取待审核上传，失败回退到本地过滤
const fetchPendingFromServer = async (p = 1) => {
  try {
    const res = await getPendingWallpapers(
      p,
      auditPageSize.value,
      titleQuery.value.trim(),
      tagQuery.value.trim()
    )
    // 兼容不同返回格式
    const list = Array.isArray(res) ? res : (res.results || res.data || [])
    pendingWallpapers.value = list
    auditPage.value = res.page || res.pagination?.page || p
    auditPageSize.value = res.pageSize || res.pagination?.pageSize || auditPageSize.value
    auditTotal.value = res.count || res.pagination?.total || res.pagination?.total_count || 0
    return true
  } catch (e) {
    console.warn('fetchPendingFromServer failed', e)
    return false
  }
}

const fetchPendingFallback = () => {
  const titleKw = titleQuery.value.trim().toLowerCase()
  const tagKw = tagQuery.value.trim().toLowerCase()
  pendingWallpapers.value = (wallpapers.value || []).filter((item) => {
    const titleOk = !titleKw || String(item.title || '').toLowerCase().includes(titleKw)
    const tagOk = !tagKw || parseTags(item.tags).join(' ').toLowerCase().includes(tagKw)
    return normalizeStatus(item.status) === 'pending' && titleOk && tagOk
  })
  auditTotal.value = pendingWallpapers.value.length
}

const ensurePendingList = async (p = auditPage.value) => {
  const ok = await fetchPendingFromServer(p)
  if (!ok) fetchPendingFallback()
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

const fetchList = async (p = editPage.value) => {
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
  }
}

const handleSearch = () => {
  editPage.value = 1
  fetchList(1)
}

const handleSearchs = async () => {
  auditPage.value = 1
  const ok = await fetchPendingFromServer(1)
  if (!ok) fetchPendingFallback()
}

const resetSearchs = async () => {
  titleQuery.value = ''
  tagQuery.value = ''
  auditPage.value = 1
  const ok = await fetchPendingFromServer(1)
  if (!ok) fetchPendingFallback()
}

const resetSearch = () => {
  titleQuery.value = ''
  tagQuery.value = ''
  editPage.value = 1
  fetchList(1)
}

const handleEditCurrentChange = (p) => { fetchList(Number(p)) }
const handleAuditCurrentChange = (p) => { ensurePendingList(Number(p)) }

const handleSelectionChange = (rows) => {
  selectedWallpapers.value = Array.isArray(rows) ? rows : []
}

const handleAuditSelectionChange = (rows) => {
  selectedAuditWallpapers.value = Array.isArray(rows) ? rows : []
}

const deleteSelectedWallpapers = async () => {
  if (!selectedWallpapers.value.length) {
    ElMessage.warning('请先选择要删除的壁纸')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确认删除选中的 ${selectedWallpapers.value.length} 张壁纸吗？`,
      '提示',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

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
    ensurePendingList(auditPage.value)
  } catch (e) {
    if (e === 'cancel' || e === 'close') return
    console.error(`批量${actionLabel}失败`, e)
    ElMessage.error(`批量${actionLabel}失败`)
  }
}

// 当切换到审核标签时，优先拉取后端待审核上传列表
import { watch } from 'vue'
watch(activeTab, (val) => {
  if (val === 'audit') {
    ensurePendingList(auditPage.value)
  } else {
    fetchList(editPage.value)
  }
})

const srcList = ref([])
const showPreview = ref(false)
const previewImage = ref('')

const buildSrcListFor = (row) => {
  const list = activeTab.value === 'audit' ? pendingWallpapers.value : wallpapers.value
  return (list || []).map((i) => i.image || i.image_url || i.url || '')
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
    tags: parseTags(row.tags),
    status: normalizeStatus(row.status) || 'pending'
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

const parseTags = (tags) => {
  if (!tags) return []
  if (Array.isArray(tags)) return tags
  try {
    if (typeof tags === 'string') {
      const s = tags.trim()
      // 如果看起来像 JSON 数组
      if (s.startsWith('[') && s.endsWith(']')) {
        const parsed = JSON.parse(s)
        return Array.isArray(parsed) ? parsed : [String(parsed)]
      }
      // 其它用逗号分割
      return s.split(',').map(t=>t.trim()).filter(Boolean)
    }
    return [String(tags)]
  } catch (e) {
    try {
      const parsed = JSON.parse(tags)
      return Array.isArray(parsed) ? parsed : [String(parsed)]
    } catch (e2) {
      return String(tags).split(',').map(t=>t.trim()).filter(Boolean)
    }
  }
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

    const payload = formData
    await editWallpaper(editForm.value.id, payload)
    ElMessage.success('已保存')
    editDialogVisible.value = false
    if (editImagePreviewUrl.value) {
      URL.revokeObjectURL(editImagePreviewUrl.value)
      editImagePreviewUrl.value = ''
    }
    editImageFile.value = null
    // 刷新数据
    fetchList(editPage.value)
  } catch (e) {
    console.error('上传图片类型与当前壁纸类型不匹配', e)
  }
}

const reviewWallpaper = async (row, action) => {
  try {
    // 后端可能期望不同的字段/动作值，兼容处理：
    // - status 使用 'approved'|'rejected' 对应模型 choices
    // - action 使用 'approve'|'reject' 以兼容基于动作的接口
    const payload = {
      action: action === 'approved' ? 'approve' : (action === 'rejected' ? 'reject' : action),
      status: action
    }
    const res = await apiReviewWallpaper(row.id, payload)
    row.status = action
    // 从 pending 列表移除
    pendingWallpapers.value = pendingWallpapers.value.filter((p) => p.id !== row.id)
    if (action === 'approved') ElMessage.success('审核通过')
    else ElMessage.warning('已驳回')
    fetchList(editPage.value)
  } catch (e) {
    console.error('审核失败', e)
    ElMessage.error('审核失败')
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

onMounted(()=>{
  if (!isAdminUser()) {
    router.replace('/');
    return;
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

h2{ margin:0; color:#fff }

:deep(.el-table .cell) { color: #fff; }
:deep(.el-table thead th .cell) { color: #9be7b1; }
:deep(.el-table tr) { background-color: transparent !important; }
:deep(.el-input__wrapper .el-input__inner::placeholder) { color: #fff; }
:deep(.el-select .el-select__input) { color: #fff; }
:deep(.el-select .el-input__inner) { color: #fff; }
:deep(.el-select .el-select__placeholder) { color: rgba(255, 255, 255, 0.75); }
:deep(.el-tabs__item) { color: #fff; }
:deep(.el-tabs__item.is-active) { color: #409EFF; }
:deep(.el-tabs__active-bar) { background-color: #409EFF; }
:deep(){
        .el-form-item__label{
            color: #FFF;
        }
    }

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
