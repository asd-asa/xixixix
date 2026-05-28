<template>
  <el-container class="admin-layout">
    <el-aside width="220px" class="admin-aside">
      <el-menu router :default-active="$route.path" :default-openeds="['/admin/wallpapers/edit']" class="admin-menu" collapse-transition>
        <div class="menu-header">个人中心</div>
        <el-menu-item index="/my/components/upload">壁纸上传</el-menu-item>
        <el-sub-menu index="/my/components/favorites">
          <template #title>壁纸收藏</template>
          <el-menu-item index="/my/components/favorites/computer">电脑壁纸收藏</el-menu-item>
          <el-menu-item index="/my/components/favorites/mobile">手机壁纸收藏</el-menu-item>
          <el-menu-item index="/my/components/favorites/avatar">头像收藏</el-menu-item>
        </el-sub-menu>
        <!-- <el-menu-item index="/my/components/profile">个人信息</el-menu-item> -->
        <el-sub-menu index="/my/components/history">
          <template #title>历史记录</template>
          <el-menu-item index="/my/components/history/computer">电脑壁纸历史</el-menu-item>
          <el-menu-item index="/my/components/history/mobile">手机壁纸历史</el-menu-item>
          <el-menu-item index="/my/components/history/avatar">头像历史</el-menu-item>
        </el-sub-menu>
        <el-menu-item index="/my/components/info">消息通知</el-menu-item>
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
