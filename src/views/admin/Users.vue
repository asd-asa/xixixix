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
        style="width: 200px"
        @keyup.enter="() => fetchUsers()"
        @blur="() => fetchUsers()"
      />
    </div>

    <el-table :data="users">
      <el-table-column prop="username" label="用户名" />
      <el-table-column prop="email" label="邮箱" />
      <el-table-column prop="banned" label="状态" width="100">
        <template #default="{ row }">
          <el-tag type="danger" v-if="row.banned">已拉黑</el-tag>
          <el-tag v-else>正常</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180">
        <template #default="{ row }">
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
      <el-pagination
        background
        layout="prev, pager, next"
        :current-page="page"
        :page-size="pageSize"
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
    page.value = data.pagination?.page || p;
    pageSize.value = data.pagination?.pageSize || ps;
    total.value = data.pagination?.total_count || data.pagination?.total || data.count || 0;
  } catch (e) {
    console.error("获取用户失败", e);
    ElMessage.error("获取用户失败");
  }
};

const toggleBan = async (row) => {
  try {
    const targetBan = !row.banned;
    const uploader = (typeof window !== "undefined" && localStorage.getItem("username")) || "";
    const res = await banUser(row.id, targetBan, uploader);
    row.banned = targetBan;
    if (res.code == 401) {
      ElMessage({ type: "error", message: res.message, duration: 1000 });
    } else if (res.code == 201) {
      ElMessage({ type: "error", message: res.message, duration: 1000 });
    } else {
      ElMessage({ type: "success", message: res.message, duration: 1000 });
    }
  } catch (e) {
    console.error("操作失败", e);
    ElMessage.error("操作失败");
  }
};

const handleCurrentChange = (p) => {
  fetchUsers(Number(p), pageSize.value);
};

const handleSizeChange = (s) => {
  pageSize.value = Number(s);
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
  width: 90%;
  min-height: 60vh;
  margin: 30px auto 0;
  padding: 16px;
  box-sizing: border-box;
  padding: 8px;
  border-radius: 6px;
  scrollbar-width: thin; /* Firefox: 宽度 */
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

</style>
