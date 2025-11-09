<script setup lang="ts">
//上传多张图片
import { onMounted, ref } from 'vue'
import { uploadWallpapers } from '@/api/wallpapers'
import { getClassifyDetail } from '@/api/title'
import { ElMessage } from 'element-plus';

const categories = ref([]); // 分类选项
const classifyDetail = ref([]); // 分类详情数据
const classifyTags = ref([]); // 分类标签
const selectedFiles = ref([]); // 存储选中的文件
const category = ref(''); // 分类字段
const title = ref(''); // 图片名称
const description = ref(''); // 图片描述
const tags = ref<string[]>([]); // 图片标签（数组）
// 图片预览相关
const dialogVisible = ref(false);
const previewImage = ref('');
// 获取分类详情数据
const fetchClassifyDetail = async () => {
    try {
        const response = await getClassifyDetail(); 
        classifyDetail.value = response; 
        categories.value = classifyDetail.value.map((item) => ({
            label: item.name, 
            value: item.name, 
        })); 
        classifyTags.value = classifyDetail.value.map((item) => ({
            label: item.tags, 
            value: item.tags, 
        }));
        
    } catch (error) {
        console.error('获取分类详情数据失败:', error); // 处理错误
    }
};
// 处理文件选择
const handleFileChange = (file, fileList) => {
    selectedFiles.value = fileList.map((item) => ({
        name: item.name,
        size: item.size,
        status: item.status,
        percentage: item.percentage,
        url: item.url || URL.createObjectURL(item.raw), // 使用 url 或生成的 URL
        raw: item.raw, // 原始文件对象
    }));
};
// 处理文件移除
const handleFileRemove = (file, fileList) => {
    selectedFiles.value = fileList; // 更新选中的文件列表
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

// 清空表单和状态
const resetForm = () => {
    selectedFiles.value = [];
    category.value = '';
    title.value = '';
    description.value = '';
    tags.value = [];
    dialogVisible.value = false;
    previewImage.value = '';
};
// 上传文件
const handleFileUpload = async () => {
    if (selectedFiles.value.length === 0) {
        console.error('请先选择文件');
        return;
    }

    const formData = new FormData();
    selectedFiles.value.forEach((file) => {
        formData.append('images', file.raw); // 使用原始文件对象
    });
    // 添加其他字段
    formData.append('category', category.value || '未分类'); // 分类字段
    formData.append('title', title.value || '未命名'); // 图片标题字段
    formData.append('description', description.value || ''); // 图片描述字段
    formData.append('tags', JSON.stringify(tags.value)); // 将标签数组转换为 JSON 字符串
    try {
        const response = await uploadWallpapers(formData);
        // 假设后端返回的响应中包含压缩后的图片 URL
        if (response && response.data) {
            const uploadedImages = response.data.map((item) => ({
                image: item.image, // 原始图片 URL
                image_url: item.image_url, 
                
            }));
        }
        // 处理上传成功后的逻辑，比如清空文件选择框、显示提示等
        resetForm(); // 调用清空表单和状态的函数
    } catch (error) {
    console.error('上传失败:', error);

    // 检查是否存在 token
    const token = localStorage.getItem('token');
    if (!token || token === 'undefined' || token === 'null' || token.trim() === '') {
    console.warn('用户未登录，跳转到登录页面');
    // 跳转到登录页面
    window.location.href = '/login'; // 替换为你的登录页面路径
    return;
}

    // 处理其他上传失败的逻辑，比如显示错误提示等
    console.error('上传失败的详细信息:', error.message || error);
    ElMessage.error('上传失败，请稍后重试。'); // 显示错误提示
}
};
// 重置上传
const resetUpload = () => {
    selectedFiles.value = [];
};
// 退出登录
const logout = () => {
    // 清除 token 和其他用户信息
    localStorage.removeItem('token'); 
    localStorage.removeItem('refresh_token'); 
    // 跳转到登录页面
    window.location.href = '/login'; // 替换为你的登录页面路径
};
// 检查是否存在 token
const hasToken = ref(false);
onMounted(() => {
    fetchClassifyDetail();
    // 检查 token 是否存在
    const token = localStorage.getItem('token');
    hasToken.value = !!token && token !== 'undefined' && token !== 'null' && token.trim() !== '';
});
</script>

<template>
    <div class="upload-wallpapers">
        <el-form style="min-width: 400px" status-icon label-width="auto"  class="demo-ruleForm">
            <el-form-item label="图片名称">
                <el-input  type="text"  autocomplete="off" v-model="title"/>
            </el-form-item>
            <el-form-item label="图片分类">
                <el-select  
                 allow-create
                 clearable 
                 v-model="category" 
                 filterable 
                 placeholder="图片分类" >
                    <el-option v-for="item in categories"  :label="item.label" :value="item.value" />
                </el-select>
            </el-form-item>
            <el-form-item label="图片描述">
                <el-input type="text" autocomplete="off" v-model="description" placeholder="图片描述" />
            </el-form-item>
            <el-form-item label="图片标签">
                <el-select 
                v-model="tags"
                multiple 
                filterable 
                allow-create 
                default-first-option 
                :reserve-keyword="false"
                placeholder="图片标签" >
                <el-option v-for="item in classifyTags"  :label="item.label" :value="item.value" />
                </el-select>
            </el-form-item>
            <el-form-item label="图片预览">
                <!-- 限制上传预览区域高度，内容过多时出现内部滚动 -->
                <div class="upload-preview">
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
                </div>

            </el-form-item>
            <div class="upload-wallpapers__btns">
                <el-form-item>
                <el-button type="primary" @click="handleFileUpload">上传图片</el-button>
                <el-button type="danger" @click="resetUpload" style="margin-left: 60px;">重置</el-button>
                <!-- 退出登录 -->
                <el-button type="warning" @click="logout" style="margin-left: 60px;"  v-if="hasToken">退出登录</el-button>
                </el-form-item>
            </div>
            
        </el-form>
    </div>

</template>

<style scoped lang="scss">
.upload-wallpapers{
    margin-top: 20px;
    height: 100%;
    width: 50%;
    margin:  30px auto 0;
    padding: 0 20px;
    .upload-wallpapers__btns{
        display: flex;
        justify-content: center;
        align-items: center;
        margin-top: 40px;
    }
}

/* 上传预览区域限制高度并启用内部滚动，防止上传列表过长把底部按钮挤出视口 */
.upload-preview{
    max-height: 360px; /* 可根据需要调整 */
    overflow-y: auto;
    padding: 8px;
    border: 1px solid rgba(0,0,0,0.04);
    border-radius: 6px;
    background: #fff;
}

/* 底部按钮保持可见：在页面滚动时尽量固定在视口底部 */
.upload-wallpapers__btns{
    position: sticky;
    bottom: 0;
    background: #fff; /* 防止覆盖内容可见性问题 */
    padding-top: 12px;
    padding-bottom: 18px;
    z-index: 5;
}

</style>