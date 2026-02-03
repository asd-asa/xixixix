<template>
  <div class="admin-users">
    <div
      style="
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
      "
    >
      <h2>用户管理</h2>
      <el-input
        v-model="query"
        placeholder="按用户名或邮箱搜索"
        clearable
        style="width: 300px"
        @keyup.enter="() => fetchUsers()"
        @blur="() => fetchUsers()"
      />
    </div>

    <el-table :data="users">
      <el-table-column prop="username" label="用户名" />
      <!-- <el-table-column prop="email" label="邮箱" /> -->
      <el-table-column prop="banned" label="状态" width="100">
        <template #default="{ row }">
          <el-tag type="danger" v-if="row.banned">已拉黑</el-tag>
          <el-tag v-else>正常</el-tag>
        </template>
      </el-table-column>
      <!-- <el-table-column prop="created_at" label="注册时间" width="180" /> -->
      <el-table-column label="操作" width="180">
        <template #default="{ row }">
          <el-button size="small" type="primary" @click="viewUser(row)"
            >查看</el-button
          >
          <el-button
            size="small"
            :type="row.banned ? 'success' : 'warning'"
            @click="toggleBan(row)"
          >
            {{ row.banned ? "恢复" : "拉黑" }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <div
      style="
        margin-top: 12px;
        display: flex;
        justify-content: flex-end;
        align-items: center;
      "
    >
      <!-- <el-button @click="fetchUsers">刷新</el-button> -->
      <el-pagination
        background
        layout="prev, pager, next, sizes"
        :current-page="page"
        :page-size="pageSize"
        :page-sizes="[5,10,20,50]"
        :total="total"
        @current-change="handleCurrentChange"
        @size-change="handleSizeChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from 'vue-router';
import { ElMessage } from "element-plus";
import { listUsers, banUser } from "@/api/user.js";

const query = ref("");
const users = ref([]);
// 分页状态
const page = ref(1);
const pageSize = ref(10);
const total = ref(0);

const fetchUsers = async (p = page.value, ps = pageSize.value) => {
  try {
    const params = {};
    if (query.value) params.search = query.value;
    params.page = p;
    params.pageSize = ps;
    const data = await listUsers(params);

    users.value = data.data || data.results || [];
    page.value = data.pagination.page || p;
    pageSize.value = data.pagination.pageSize || ps;
    total.value = data.pagination.total_count || data.pagination.total || 0;
  } catch (e) {
    console.error("获取用户失败", e);
    ElMessage.error("获取用户失败");
  }
};

const viewUser = (row) => {
  ElMessage.info(`用户：${row.username}，邮箱：${row.email || "未填写"}`);
};

const toggleBan = async (row) => {
  try {
    const targetBan = !row.banned;
    const uploader =
      (typeof window !== "undefined" && localStorage.getItem("username")) || "";
    const res = await banUser(row.id, targetBan, uploader);
    row.banned = targetBan;
    if (res.code == 401) {
      ElMessage({
        type: "error", // 指定提示类型：success/error/warning/info
        message: res.message, // 提示文本
        duration: 1000, // 提示持续时间，单位毫秒
      });
    }else if(res.code == 201){
      ElMessage({
        type: "error", 
        message: res.message, 
        duration: 1000, 
      });
    }else{
        ElMessage({
        type: "success", 
        message: res.message, 
        duration: 1000, 
      });
    }
  } catch (e) {
    console.error("操作失败", e);
    ElMessage.error("操作失败");
  }
};

// 分页控件回调：处理页码变化
const handleCurrentChange = (p) => {
  // p 应该是数字页码，调用 fetchUsers
  fetchUsers(Number(p), pageSize.value);
};

// 分页控件回调：处理每页条数变化
const handleSizeChange = (s) => {
  pageSize.value = Number(s);
  // 切换页大小后回到第 1 页
  fetchUsers(1, pageSize.value);
};

const router = useRouter();

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

onMounted(() => {
  // 非 admin 强制回到首页
  if (!isAdminUser()) {
    router.replace('/');
    return;
  }
  fetchUsers();
});
</script>

<style scoped lang="scss">
.admin-users {
  border-radius: 17px;
  background: rgba(44, 100, 146, 0.5);
  margin-top: 20px;
  /* 移动端优先：默认较窄的容器 */
  width: 90%;
  max-width: 1100px;
  min-height: 60vh;
  margin: 30px auto 0;
  padding: 16px;
  box-sizing: border-box;
  max-height: min(50vh, 360px);
  overflow-y: auto;
  padding: 8px;
  border-radius: 6px;
  scrollbar-width: thin; /* Firefox: 宽度 */
  scrollbar-color: rgba(165, 149, 223, 0.5) transparent;
  transition:
    width 240ms ease,
    padding 200ms ease;
  :deep() {
    .el-form-item__label {
      color: #fff;
    }
    .el-table .cell {
      color: #fff;
    }
    .el-table tr {
      background-color: transparent !important;
    }

  }
 ::v-deep .el-input__wrapper .el-input__inner::placeholder {
    color: #fff;
  }
  h2 {
    color: #fff;
  }
}
/* 平板及以上：调整 admin-users 容器宽度、内边距与表格高度 */
@media (min-width: 768px) {
  .admin-users {
    width: 70%;
    padding: 20px;
    min-height: 65vh;
    margin: 30px auto 0;
  }
  /* 限制表格高度，超出出现滚动（需要 el-table 或外层容器支持高度） */
  .admin-users .el-table {
    max-height: min(60vh, 520px);
    overflow: auto;
  }
  .admin-users h2 {
    font-size: 22px;
  }
}

/* 桌面大屏：进一步收窄容器并提升标题字号 */
@media (min-width: 1200px) {
  .admin-users {
    width: 50%;
    padding: 24px;
    min-height: 68vh;
  }
  .admin-users .el-table {
    max-height: min(70vh, 720px);
  }
  .admin-users h2 {
    font-size: 24px;
  }
}

/* 横屏小屏（手机横屏或小平板横屏）调整：提高容器宽度，避免元素拥挤 */
@media (max-width: 767px) and (orientation: landscape) {
  .admin-users {
    width: 80%;
    padding: 12px;
  }
  .admin-users .el-table {
    max-height: 60vh;
  }
}

/* 竖屏时确保底部按钮垂直排列，以便触控操作 */
@media (max-width: 767px) and (orientation: portrait) {
  .admin-users > div:last-child {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
}
</style>
