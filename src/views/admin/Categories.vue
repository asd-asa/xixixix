<template>
  <div class="admin-categories">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
      <h2>分类管理</h2>
      <el-button type="primary" size="small">新增分类</el-button>
    </div>
    <el-table :data="categories">
      <el-table-column prop="name" label="名称"/>
      <el-table-column label="操作" width="160">
        <template #default="{row}">
          <el-button size="small">编辑</el-button>
          <el-button size="small" type="danger">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const categories = ref([])

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

onMounted(()=>{
  if (!isAdminUser()) {
    router.replace('/');
    return;
  }
  categories.value = [{name:'示例分类1'},{name:'示例分类2'}]
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

:deep(.el-table .cell) { color: #fff; }
:deep(.el-table tr) { background-color: transparent !important; }
</style>
