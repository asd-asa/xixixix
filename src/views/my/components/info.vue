<template>
  <div class="user-profile">
    <div class="page-header">
      <div class="upload-wallpapers__title">消息通知</div>
      <div class="page-actions">
        <el-button type="primary" @click="markAllRead" :disabled="list.length === 0">
          全部已读
        </el-button>
        <el-button @click="() => loadNotifications()">刷新</el-button>
      </div>
    </div>

    <el-table :data="list" style="width: 100%">
      <el-table-column type="index" label="序号" width="80" />
      <el-table-column label="类型" width="120">
        <template #default="{ row }">
          <el-tag v-if="getType(row) === 'approved'" type="success">通过</el-tag>
          <el-tag v-else-if="getType(row) === 'rejected'" type="danger">驳回</el-tag>
          <el-tag v-else type="info">通知</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="内容" min-width="260">
        <template #default="{ row }">
          {{ getMessage(row) }}
        </template>
      </el-table-column>
      <el-table-column label="时间" width="180">
        <template #default="{ row }">
          {{ formatTime(row.created_at || row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.is_read ? 'success' : 'warning'">
            {{ row.is_read ? '已读' : '未读' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="140">
        <template #default="{ row }">
          <el-button size="small" type="primary" @click="markRead(row)" :disabled="row.is_read">
            标记已读
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pager">
      <el-pagination
        background
        layout="prev, pager, next"
        :current-page="page"
        :page-size="pageSize"
        :total="total"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import { getServerUrl } from '@/utils/request.js'
import { markNotificationRead, markAllNotificationsRead } from '@/api/user.js'

const list = ref<any[]>([])
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)

const normalize = (res: any) => {
  const rows = res?.results || res?.data || res || []
  list.value = Array.isArray(rows) ? rows : []
  total.value = res?.total || res?.count || 0
}

const loadNotifications = async (p = page.value) => {
  try {
    const offset = (p - 1) * pageSize.value
    const userrole = window.localStorage.getItem('username') || ''
    const token = window.localStorage.getItem('token') || ''
    const response = await axios.get(`${getServerUrl()}user/notifications/`, {
      params: { limit: pageSize.value, offset, userrole },
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    const res = response.data
    normalize(res)
    page.value = p
  } catch (error) {
    console.error('获取通知失败', error)
    ElMessage.error('获取通知失败')
  }
}

const handleCurrentChange = (p: number) => {
  loadNotifications(Number(p))
}

const markRead = async (row: any) => {
  try {
    await markNotificationRead(row.id)
    row.is_read = true
    ElMessage.success('已标记为已读')
  } catch (error) {
    console.error('标记已读失败', error)
    ElMessage.error('标记已读失败')
  }
}

const markAllRead = async () => {
  try {
    await markAllNotificationsRead()
    list.value = list.value.map((item) => ({ ...item, is_read: true }))
    ElMessage.success('全部已读')
  } catch (error) {
    console.error('全部已读失败', error)
    ElMessage.error('全部已读失败')
  }
}

const getType = (row: any) => {
  return row.notification_type || row.type || row.action || row.status || ''
}

const getMessage = (row: any) => {
  return (
    row.message ||
    row.content ||
    row.title ||
    row.text ||
    row.notification_message ||
    '暂无内容'
  )
}

const formatTime = (value: any) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

onMounted(() => {
  loadNotifications()
})

</script>

<style scoped>
.user-profile {
  border-radius: 17px;
  background: rgba(44, 100, 146, 0.5);
  margin-top: 20px;
  width: 90%;
  min-height: 60vh;
  margin: 30px auto 0;
  padding: 16px;
  box-sizing: border-box;
  padding: 8px;
  border-radius: 6px;
  scrollbar-width: thin; 
  scrollbar-color: rgba(165, 149, 223, 0.5) transparent;
  transition: width 240ms ease, padding 200ms ease;
  :deep() {
    .el-form-item__label { color: #fff; }
    .el-table .cell { color: #fff; }
    .el-table thead th .cell { color: #9be7b1; }
    .el-table tr { background-color: transparent !important; }
  }
 ::v-deep .el-input__wrapper .el-input__inner::placeholder { color: #fff; }
  h2 { color: #fff; }
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.page-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
.pager {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}
.upload-wallpapers__title {
  font-size: 20px; /* 移动端默认字号 */
  color: #fff;
  text-align: center;
  margin-bottom: 16px;
}
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
</style>
