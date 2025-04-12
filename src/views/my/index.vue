<script setup lang="ts">
//上传多张图片
import { ref } from 'vue'
import { uploadWallpapers } from '@/api/wallpapers'

const selectedFiles = ref([]); // 存储选中的文件
const category = ref(''); // 分类字段
// 处理文件选择
const onFileChange = (event) => {
    selectedFiles.value = Array.from(event.target.files); // 将 FileList 转为数组
    console.log('选中的文件:', selectedFiles.value);
};
// 图片预览相关
const dialogVisible = ref(false);
const previewImage = ref('');
// 处理文件选择
// const handleFileChange = (file, fileList) => {
//     selectedFiles.value = fileList.map((item) => ({
//         name: item.name,
//         size: item.size,
//         status: item.status,
//         percentage: item.percentage,
//         url: item.url || URL.createObjectURL(item.raw), // 使用 url 或生成的 URL
//         raw: item.raw, // 原始文件对象
//         image: item.url || URL.createObjectURL(item.raw), // 预览图片
//     }));
//     console.log('选中的文件:', selectedFiles.value);
// };
// 处理文件移除
const handleFileRemove = (file, fileList) => {
    selectedFiles.value = fileList; // 更新选中的文件列表
    console.log('移除的文件:', file, '剩余文件:', fileList);
    // 更新预览图片
    if (previewImage.value === file.url || previewImage.value === file.raw.url) {
        previewImage.value = ''; // 清空预览图片
        dialogVisible.value = false; // 关闭预览对话框
    }
};
// 处理文件预览
const handleFilePreview = (file) => {
    previewImage.value = file.url || URL.createObjectURL(file.raw);
    dialogVisible.value = true;
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
        // 处理上传成功后的逻辑，比如清空文件选择框、显示提示等
        selectedFiles.value = []; // 清空选中的文件
    } catch (error) {
        console.error('上传失败:', error);
    }
};
// 重置上传
const resetUpload = () => {
    selectedFiles.value = [];
};
</script>

<template>
    <div class="upload-wallpapers">
        <el-form style="min-width: 400px" status-icon label-width="auto" class="demo-ruleForm">
            <el-form-item label="图片名称">
                <el-input type="type" autocomplete="off" />
            </el-form-item>
            <el-form-item label="图片分类">
                <el-select filterable placeholder="Select" style="width: 240px">
                    <el-option v-for="item in 6" />
                </el-select>
            </el-form-item>
            <el-form-item label="图片描述">
                <el-input type="password" autocomplete="off" />
            </el-form-item>
            <el-form-item label="图片标签">
                <el-select multiple filterable allow-create default-first-option :reserve-keyword="false"
                    placeholder="Choose tags for your article" style="width: 240px">
                    <el-option v-for="item in 6" />
                </el-select>
            </el-form-item>
            <el-form-item label="图片预览">
                <el-upload
                    drag
                    multiple
                    :limit="50"
                    :auto-upload="false"
                    list-type="picture-card"
                    :file-list="selectedFiles"
                    :on-change="handleFileChange"
                    :on-remove="handleFileRemove"
                    :on-preview="handleFilePreview"
                     accept="image/*"
                >
                    <el-icon>
                        <Plus />
                    </el-icon>
                </el-upload>

                <!-- 图片预览对话框 -->
                <el-dialog v-model="dialogVisible" title="图片预览">
                    <img :src="previewImage" style="width: 100%;" alt="Preview Image" />
                </el-dialog>

            </el-form-item>
            <el-form-item>
                <el-button type="primary" @click="handleFileUpload">上传图片</el-button>
                <el-button @click="resetUpload">重置</el-button>
            </el-form-item>
        </el-form>

        <form @submit.prevent="handleFileUpload">
    <input type="file" name="images" multiple @change="onFileChange">
    <input type="text" name="category" v-model="category" placeholder="请输入分类">
    <button type="submit">上传</button>
         </form>
    </div>

</template>

<style scoped lang="scss"></style>