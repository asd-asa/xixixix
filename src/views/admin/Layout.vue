<template>
  <el-container class="admin-layout">
    <el-aside width="220px" class="admin-aside">
      <el-menu router :default-active="$route.path" :default-openeds="['/admin/wallpapers/edit']" class="admin-menu" collapse-transition>
        <div class="menu-header">后台管理</div>
        <el-menu-item index="/admin/dashboard">首页</el-menu-item>
        <el-sub-menu index="/admin/wallpapers/edit" >
          <template #title >壁纸编辑</template>
          <el-menu-item index="/admin/wallpapers/edit/computer">电脑壁纸</el-menu-item>
          <el-menu-item index="/admin/wallpapers/edit/phone">手机壁纸</el-menu-item>
          <el-menu-item index="/admin/wallpapers/edit/avatar">头像</el-menu-item>
        </el-sub-menu>
        <el-menu-item index="/admin/wallpapers/audit">壁纸审核</el-menu-item>
        <el-menu-item index="/admin/users">用户管理</el-menu-item>
        <el-menu-item index="/admin/categories">分类管理</el-menu-item>
        <!-- <el-menu-item index="/admin/tags">标签管理</el-menu-item> -->
      </el-menu>
    </el-aside>
    <el-main class="admin-main">
      <router-view />
    </el-main>
  </el-container>
</template>

<script setup>
</script>

<style scoped>
.admin-layout{
    min-height:80vh;
    margin-top:110px;
}
.admin-aside{
  background: rgba(44, 100, 146, 0.5);
  padding-top: 12px;
  border-radius: 6px;
}
.admin-main{
  padding: 16px;
  box-sizing: border-box;
}
.admin-menu {
  border-right: none;
  background: transparent;
}
.menu-header {
  color: #fff;
  padding: 0 20px 12px;
  font-weight: 600;
  font-size: 20px;
  text-align: center;
}
:deep(.el-menu-item) {
  color: #fff;
}
:deep(.el-sub-menu__title) {
  color: #fff;
}
:deep(.el-sub-menu .el-menu-item) {
  color: #fff;
}
:deep(.el-menu-item:hover) {
  background: rgba(255, 255, 255, 0.14);
}
:deep(.el-sub-menu__title:hover) {
  background: rgba(255, 255, 255, 0.14);
}
:deep(.el-menu-item.is-active) {
  color: #fff;
  background: rgba(255, 255, 255, 0.2);
}
:deep(.el-sub-menu.is-active > .el-sub-menu__title) {
  color: #fff;
}
</style>
