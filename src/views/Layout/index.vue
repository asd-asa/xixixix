<template>
  <el-scrollbar>
    <LayoutSelect
      @categoryChange="handleCategoryChange"
      @resolutionChange="handleResolutionChange"
      @searchChange="handleSearchChange"
      @imgCategoryChange="handleimgCategoryChange"
    />
    <LayoutContent
      :wallpapers="wallpapers"
      @refresh="handleRefresh"
      @loadMore="handleLoadMore"
      @deleted="handleDeleted"
    />
    <LayoutFoot
      :total="total"
      :current-page="currentPage"
      :page-size="pageSize"
      :mediaType="selectedType"
      @update-page="handlePageChange"
    />
  </el-scrollbar>
</template>

<script setup>
import LayoutSelect from "./components/LayoutSelect.vue";
import LayoutContent from "./components/LayoutContent.vue";
import LayoutFoot from "./components/LayoutFoot.vue";
import { onMounted, ref, watch } from "vue";
import { getWallpapersPage } from "@/api/wallpapers.js"; 

const wallpapers = ref([]); // 存储壁纸数据
const total = ref(0); // 总条数
const selectedCategory = ref(""); // 当前选择的分类
const selectedResolution = ref(""); // 当前选择的分辨率
const selectedTags = ref(""); // 搜索框的值
const selectedType = ref(""); // 当前选择的类型
const currentPage = ref(1); // 当前页码
const pageSize = ref(9); // 每页大小

const fetchWallpapers = async (append = false) => {
  try {
    const response = await getWallpapersPage(
      selectedCategory.value,
      currentPage.value,
      pageSize.value,
      selectedResolution.value,
      selectedTags.value,
      selectedType.value
    )
    const results = response.results || [];
    if (append) {
      wallpapers.value = wallpapers.value.concat(results);
    } else {
      wallpapers.value = results;
    }
    total.value = response.count || 0;
  } catch (error) {
    console.error("获取壁纸数据失败:", error);
    if (error && error.message === "未找到 token，阻止请求发送") {
      window.location.href = "/login";
    }
  }
};

// 初次加载
onMounted(() => {
  // currentPage.value = 1;
  // fetchWallpapers(false);
});

// 处理子组件发出的 loadMore 事件：加载下一页并追加
const handleLoadMore = () => {
  currentPage.value += 1;
  fetchWallpapers(true);
};

// 子组件刷新（重置第一页）
const handleRefresh = () => {
  currentPage.value = 1;
  fetchWallpapers(false);
};
// 子组件删除某一项（只从本地数组移除，不重新请求全部）
const handleDeleted = (id) => {
  wallpapers.value = wallpapers.value.filter((item) => item.id !== id);
  if (typeof total.value === "number" && total.value > 0)
    total.value = Math.max(0, total.value - 1);
};
// 监听分类变化
const handleCategoryChange = (category) => {
  selectedCategory.value = category;
  currentPage.value = 1; // 重置页码
  fetchWallpapers(false);
};
// 监听分辨率变化
const handleResolutionChange = (resolution) => {
  wallpapers.value = [];
  selectedResolution.value = resolution;
  currentPage.value = 1; // 重置页码
  fetchWallpapers(false);
};
// 监听搜索框变化
const handleSearchChange = (tags) => {
  selectedTags.value = tags;
  currentPage.value = 1; // 重置页码
  fetchWallpapers(false);
};
// 监听类型变化
const handleimgCategoryChange = (type) => {
  selectedType.value = type;
  currentPage.value = 1; // 重置页码
  fetchWallpapers(false);
};
// 监听分页变化
const handlePageChange = ({ page, pageSize: newPageSize }) => {
  currentPage.value = page;
  pageSize.value = newPageSize;
  fetchWallpapers();
};
// onMounted(() => {
//     fetchWallpapers();
// });
</script>

<style lang="scss" scoped></style>
