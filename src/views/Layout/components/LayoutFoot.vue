<template>
 <div class="container">
        <div class="box1">
            <el-pagination
                background
                layout="prev, pager, next"
                :total="total"
                :current-page="currentPage"
                :page-size="pageSize"
                @current-change="handlePageChange"/>
            <div class="box2">
                当前共 {{ total }} 张 / {{ totalPages }} 页 跳转至 {{ currentPage }} 页
            </div>
        </div>

    </div>
</template>

<script setup>
import { ref,onMounted,computed, defineEmits, } from 'vue'
import { getWallpapersPage } from '@/api/wallpapers'
const currentPage = ref(1); // 当前页码
const pageSize = ref(12); // 每页条数
const total = ref(0); // 总条数
const wallpapers = ref([]); // 存储壁纸数据
const totalPages = computed(() => Math.ceil(total.value / pageSize.value)); // 总页数

// 定义事件，用于向父组件传递数据
const emit = defineEmits(['update-wallpapers']); // 定义事件名称

// 处理分页切换
const handlePageChange = async (page) => {
    currentPage.value = page; // 更新当前页码
    // console.log('当前页码:', currentPage.value);
    await getWallpapers(); // 根据当前页码重新获取数据
};
// 获取分页数据
const getWallpapers = async () => {
    try {
        const response = await getWallpapersPage(currentPage.value, pageSize.value);
        console.log('获取分页数据成功:', response);
        total.value = response.count; // 更新总条数
        // 这里可以处理返回的数据，例如更新图片列表
        wallpapers.value = response.results; // 更新壁纸数据
        // 将数据通过 emit 传递给父组件
        emit('update-wallpapers', { wallpapers: wallpapers.value, total: total.value });
        // console.log('壁纸数据:', wallpapers.value);
    } catch (error) {
        console.error('获取分页数据失败:', error);
    }
};


onMounted(() => {
    getWallpapers(); // 组件挂载时获取数据
});
</script>

<style lang="scss" scoped>
.box1 {
    width: 100%;
    height: 60px;
    display: flex;
    justify-content: center;
    align-items: center;

    .box2 {
        margin-left: 40px;
    }
}
</style>