<template>
  <el-scrollbar>
    <LayoutSelect
      @categoryChange="handleCategoryChange"
      @resolutionChange="handleResolutionChange"
      @searchChange="handleSearchChange"
      @imgCategoryChange="handleimgCategoryChange"
    />
    <div class="contentdiv">
    <LayoutContent
      :wallpapers="wallpapers"
      @deleted="deleted"
      @imagesLoaded="onImagesLoaded"
    />
    <LayoutFoot
      :total="total"
      :current-page="currentPage"
      :page-size="pageSize"
      :mediaType="selectedType"
      @update-page="handlePageChange"
    />
    </div>
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

const isLoading = ref(false);
// 获取壁纸数据
const fetchWallpapers = async () => {
  isLoading.value = true;
  try {
    const response = await getWallpapersPage(
      selectedCategory.value,
      currentPage.value,
      pageSize.value,
      selectedResolution.value,
      selectedTags.value,
      selectedType.value
    );
    const results = response.results || [];
    wallpapers.value = results;
    total.value = response.count || 0;
    return results;
  } catch (err) {
    console.error("获取壁纸失败:", err);
    // 出错时也关闭 loading，避免一直转圈
    isLoading.value = false;
  }
};
// 图片加载完成回调
const onImagesLoaded = () => {
  isLoading.value = false;
};
// 删除图片后的处理
const deleted = async () => {
  // 保持当前页；若删除后当前页没有数据且不是第一页，则回退一页并再次请求
  const results = await fetchWallpapers();
  if ((results.length === 0 || total.value === 0) && currentPage.value > 1) {
    currentPage.value = Math.max(1, currentPage.value - 1);
    await fetchWallpapers();
  }
};

// 监听分类变化
const handleCategoryChange = (category) => {
  selectedCategory.value = category;
  currentPage.value = 1; // 重置页码
  fetchWallpapers();
};
// 监听分辨率变化
const handleResolutionChange = (resolution) => {
  wallpapers.value = [];
  selectedResolution.value = resolution;
  currentPage.value = 1; // 重置页码
  fetchWallpapers();
};
// 监听搜索框变化
const handleSearchChange = (tags) => {
  wallpapers.value = [];
  selectedTags.value = tags;
  currentPage.value = 1; // 重置页码
  fetchWallpapers();
};
// 监听类型变化
const handleimgCategoryChange = (type) => {
  wallpapers.value = [];
  selectedType.value = type;
  currentPage.value = 1; // 重置页码
  fetchWallpapers();
};
// 监听分页变化
const handlePageChange = ({ page, pageSize: newPageSize }) => {
  wallpapers.value = [];
  currentPage.value = page;
  pageSize.value = newPageSize;
  fetchWallpapers();
};
</script>

<style lang="scss" scoped>
.contentdiv{
  width: 100%;
  min-height: 93vh;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  position: relative;
}
</style>
