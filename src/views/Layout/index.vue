<template>
    <LayoutSelect 
    @categoryChange="handleCategoryChange" 
    @resolutionChange="handleResolutionChange"
    />
    <LayoutContent 
     :wallpapers="wallpapers"
     />
    <LayoutFoot 
        :total="total"
        :current-page="currentPage"
        :page-size="pageSize"
        @update-page="handlePageChange"
    />

</template>

<script setup>
import LayoutSelect from './components/LayoutSelect.vue'
import LayoutContent from './components/LayoutContent.vue'
import LayoutFoot from './components/LayoutFoot.vue'
import { ref, watch } from 'vue';
import { getWallpapersPage } from '@/api/wallpapers.js';


const wallpapers = ref([]); // 存储壁纸数据
const total = ref(0); // 总条数
const selectedCategory = ref(''); // 当前选择的分类
const selectedResolution = ref(''); // 当前选择的分辨率
const currentPage = ref(1); // 当前页码
const pageSize = ref(12); // 每页大小

// 获取壁纸数据
const fetchWallpapers = async () => {
    try {
        const response = await getWallpapersPage(
            selectedCategory.value, currentPage.value, pageSize.value,
            selectedResolution.value  // 传递分辨率参数
        );
        wallpapers.value = response.results; // 假设后端返回的数据结构中有 `results`
        total.value = response.count; // 假设后端返回的数据结构中有 `count`
        console.log('获取壁纸数据成功:', wallpapers.value, total.value);
    } catch (error) {
        console.error('获取壁纸数据失败:', error);
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
    console.log('分辨率变化:', resolution);
    currentPage.value = 1; // 重置页码
    fetchWallpapers();
};
// 监听分页变化
const handlePageChange = ({ page, pageSize: newPageSize }) => {
    currentPage.value = page;
    pageSize.value = newPageSize;
    fetchWallpapers();
};
// 初始化加载
watch([selectedCategory, currentPage, pageSize], fetchWallpapers, { immediate: true });
</script>

<style lang="scss" scoped >

</style>