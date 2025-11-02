<template>
    <el-scrollbar max-height="1000px">
    <LayoutSelect 
    @categoryChange="handleCategoryChange" 
    @resolutionChange="handleResolutionChange"
    @searchChange="handleSearchChange"
    @imgCategoryChange="handleimgCategoryChange"
    />
    <LayoutContent 
     :wallpapers="wallpapers"
     @refresh="fetchWallpapers"
     />
    <LayoutFoot 
        :total="total"
        :current-page="currentPage"
        :page-size="pageSize"
        @update-page="handlePageChange"
    />
  </el-scrollbar>
</template>

<script setup>
import LayoutSelect from './components/LayoutSelect.vue'
import LayoutContent from './components/LayoutContent.vue'
import LayoutFoot from './components/LayoutFoot.vue'
import { onMounted, ref, watch } from 'vue';
import { getWallpapersPage } from '@/api/wallpapers.js';


const wallpapers = ref([]); // 存储壁纸数据
const total = ref(0); // 总条数
const selectedCategory = ref(''); // 当前选择的分类
const selectedResolution = ref(''); // 当前选择的分辨率
const selectedTags = ref(''); // 搜索框的值
const selectedType = ref(''); // 当前选择的类型
const currentPage = ref(1); // 当前页码
const pageSize = ref(9); // 每页大小

// 获取壁纸数据
const fetchWallpapers = async () => {
    try {
        const response = await getWallpapersPage(
            selectedCategory.value, currentPage.value, pageSize.value,
            selectedResolution.value ,selectedTags.value ,selectedType.value// 传递分辨率参数
        );
        wallpapers.value = response.results;
        total.value = response.count;     
  } catch (error) {
        console.error('获取壁纸数据失败:', error);
        if (error.message === '未找到 token，阻止请求发送') {
            // 跳转到登录页面或提示用户登录
            window.location.href = '/login';
        }
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
    selectedResolution.value = resolution;
    currentPage.value = 1; // 重置页码
    fetchWallpapers();
};
// 监听搜索框变化
const handleSearchChange = (tags) => {
    selectedTags.value = tags;
    currentPage.value = 1; // 重置页码
    fetchWallpapers();
};
// 监听类型变化
const handleimgCategoryChange = (type) => {
    selectedType.value = type;
    currentPage.value = 1; // 重置页码
    fetchWallpapers();
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

<style lang="scss" scoped >

</style>