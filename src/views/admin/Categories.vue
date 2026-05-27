<template>
  <div class="admin-categories">
    <div class="page-header">
      <h2>分类管理</h2>
      <el-button type="primary" @click="openCreateDialog">新增分类</el-button>
    </div>
    <el-table :data="categories" v-loading="loading">
      <el-table-column prop="name" label="名称" min-width="180" />
      <el-table-column prop="tags" label="标签" min-width="180" />
      <el-table-column label="操作" width="200">
        <template #default="{row}">
          <el-button size="small" @click="openEditDialog(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="520px">
      <el-form :model="form" label-width="90px">
        <el-form-item label="名称">
          <el-input v-model="form.name" placeholder="请输入分类名称" />
        </el-form-item>
        <el-form-item label="标签">
          <el-input v-model="form.tags" placeholder="请输入分类标签" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveCategory">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getClassifyItems,
  getClassifyItemDetail,
  createClassifyItem,
  updateClassifyItem,
  deleteClassifyItem,
} from '@/api/title.js'

const router = useRouter()
const categories = ref([])
const loading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const editingId = ref(null)
const form = ref({
  name: '',
  tags: ''
})

const dialogTitle = computed(() => (editingId.value ? '编辑分类' : '新增分类'))

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

const fetchCategories = async () => {
  loading.value = true
  try {
    const res = await getClassifyItems()
    categories.value = normalizeList(res)
  } catch (error) {
    console.error('获取分类列表失败:', error)
    ElMessage.error('获取分类列表失败')
    categories.value = []
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  form.value = {
    name: '',
    tags: ''
  }
  editingId.value = null
}

const openCreateDialog = () => {
  resetForm()
  dialogVisible.value = true
}

const openEditDialog = async (row) => {
  try {
    const detail = await getClassifyItemDetail(row.id || row.pk)
    const data = Array.isArray(detail) ? detail[0] : (detail?.data || detail)
    form.value = {
      name: data?.name || row.name || '',
      tags: data?.tags || row.tags || ''
    }
    editingId.value = row.id || row.pk
    dialogVisible.value = true
  } catch (error) {
    console.error('获取分类详情失败:', error)
    ElMessage.error('获取分类详情失败')
  }
}

const saveCategory = async () => {
  if (!form.value.name.trim()) {
    ElMessage.warning('请输入分类名称')
    return
  }

  saving.value = true
  try {
    const payload = {
      name: form.value.name.trim(),
      tags: form.value.tags.trim(),
    }
    if (editingId.value) {
      await updateClassifyItem(editingId.value, payload)
      ElMessage.success('分类已更新')
    } else {
      await createClassifyItem(payload)
      ElMessage.success('分类已新增')
    }
    dialogVisible.value = false
    resetForm()
    await fetchCategories()
  } catch (error) {
    console.error('保存分类失败:', error)
    ElMessage.error('保存分类失败')
  } finally {
    saving.value = false
  }
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确认删除分类「${row.name || '-'}」吗？`,
      '提示',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    await deleteClassifyItem(row.id || row.pk)
    ElMessage.success('删除成功')
    await fetchCategories()
  } catch (error) {
    if (error === 'cancel' || error === 'close') return
    console.error('删除分类失败:', error)
    ElMessage.error('删除分类失败')
  }
}

onMounted(()=>{
  if (!isAdminUser()) {
    router.replace('/');
    return;
  }
  fetchCategories()
})
</script>

<style scoped>
.admin-categories {
  border-radius: 17px;
  background: rgba(44, 100, 146, 0.5);
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

h2{ margin:0; color:#fff }

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

:deep(.el-table .cell) { color: #fff; }
:deep(.el-table thead th .cell) { color: #9be7b1; }
:deep(.el-table tr) { background-color: transparent !important; }

:deep(.el-dialog) {
  background: rgba(44, 100, 146, 0.96);
}

:deep(.el-dialog__title),
:deep(.el-form-item__label) {
  color: #fff;
}

:deep(.el-input__wrapper),
:deep(.el-textarea__inner) {
  background: rgba(255, 255, 255, 0.08);
  box-shadow: none;
}

:deep(.el-input__inner) {
  color: #fff;
}
</style>
