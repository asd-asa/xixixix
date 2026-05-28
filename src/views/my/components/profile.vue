<template>
  <div class="user-profile">
    <div class="upload-wallpapers__title">个人信息</div>
     
  </div>
</template>

<script lang="ts" setup>

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
.upload-wallpapers__title {
  font-size: 20px; /* 移动端默认字号 */
  color: #fff;
  text-align: center;
  margin-bottom: 16px;
}
</style>
