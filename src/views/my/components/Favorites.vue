<template>
  <div class="user-favorites">
    <router-view />
  </div>
</template>

<script setup>
import { ref } from 'vue'

</script>

<style scoped>
.user-favorites {
  border-radius: 17px;
  background: rgba(44, 100, 146, 0.5);
  margin-top: 20px;
  width: 90%;
  min-height: 70vh;
  margin: 30px auto 0;
  padding: 16px;
  box-sizing: border-box;
  padding: 8px;
  border-radius: 6px;
  scrollbar-width: thin;
  scrollbar-color: rgba(165, 149, 223, 0.5) transparent;
  transition: width 240ms ease, padding 200ms ease;
}
.tabs-wrap { padding: 8px 16px; }
.list-wrap { padding: 8px 12px; }
:deep(.el-table .cell) { color: #fff; }
:deep(.el-table thead th .cell) { color: #9be7b1; }
:deep(.el-table tr) { background-color: transparent !important; }
:deep(.el-button) { border-radius: 10px; }
</style>
