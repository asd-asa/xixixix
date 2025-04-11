<template>
    <LayoutHeader />
    <LayoutSelect />
    <LayoutContent :wallpapers="wallpapers" :total="total" />
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
    <form @submit.prevent="handleFileUpload">
    <input type="file" name="images" multiple @change="onFileChange">
    <input type="text" name="category" v-model="category" placeholder="请输入分类">
    <button type="submit">上传</button>
</form>
</template>

<script setup>
import LayoutHeader from './components/LayoutHeader.vue'
import LayoutSelect from './components/LayoutSelect.vue'
import LayoutContent from './components/LayoutContent.vue'
//上传多张图片
import { ref,onMounted,computed } from 'vue'
import {uploadWallpapers,getWallpapersPage} from '@/api/wallpapers'

const selectedFiles = ref([]); // 存储选中的文件
const category = ref('风景','动漫'); // 分类字段
const currentPage = ref(1); // 当前页码
const pageSize = ref(12); // 每页条数
const total = ref(0); // 总条数
const wallpapers = ref([]); // 存储壁纸数据
const totalPages = computed(() => Math.ceil(total.value / pageSize.value)); // 总页数

// 处理文件选择
const onFileChange = (event) => {
    selectedFiles.value = Array.from(event.target.files); // 将 FileList 转为数组
};

// 上传文件
const handleFileUpload = async () => {
    if (selectedFiles.value.length === 0) {
        console.error('请先选择文件');
        return;
    }

    const formData = new FormData();
    selectedFiles.value.forEach((file) => {
        formData.append('images', file);
    });
    formData.append('category', category.value); // 添加分类字段

    try {
        const response = await uploadWallpapers(formData);
        console.log('上传成功:', response);
    } catch (error) {
        console.error('上传失败:', error);
    }
};
// 处理分页切换
const handlePageChange = async (page) => {
    currentPage.value = page; // 更新当前页码
    console.log('当前页码:', currentPage.value);
    await getWallpapers(); // 根据当前页码重新获取数据
};
// 获取分页数据
const getWallpapers = async () => {
    try {
        const response = await getWallpapersPage(currentPage.value, pageSize.value);
        console.log('获取分页数据成功:', response);
        total.value = response.count; // 更新总条数
        // 这里可以处理返回的数据，例如更新图片列表
        wallpapers.value = response.results; // 更新图片列表
        console.log('壁纸数据:', wallpapers.value);
    } catch (error) {
        console.error('获取分页数据失败:', error);
    }
};


onMounted(() => {
    getWallpapers(); // 组件挂载时获取数据
});
</script>

<style lang="scss" scoped >
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