<script setup>
import { ref, defineEmits, onMounted } from 'vue';
import { getClassifyDetail } from '@/api/title'
import { searchWallpapers } from '@/api/wallpapers'

const classifyDetail = ref([]); // 分类详情数据

// 分类选项
const categories = ref([]);

// 分辨率选项（按区间分类）
const resolutions = ref([]);

const imgcategory = ref([
    { label: '电脑壁纸', value: 'computer' },
    { label: '手机壁纸', value: 'mobile' },
    { label: '平板壁纸', value: 'unknown' },
    { label: '头像', value: 'avatar' },
]);

// 获取分类详情数据
const fetchClassifyDetail = async () => {
    try {
        const response = await getClassifyDetail();
        classifyDetail.value = response;
        categories.value = classifyDetail.value.map((item) => ({
            label: item.name,
            value: item.name,
        }));
        resolutions.value = classifyDetail.value
            .map((item) => ({
                label: item.resolution,
                value: item.resolution,
            }))
            .filter((item) => item.label && item.value);

    } catch (error) {
        console.error('获取分类详情数据失败:', error); // 处理错误
    }
};
// 异步搜索方法
const querySearchAsync = async (queryString, callback) => {
    if (!queryString) {
        callback([]); // 如果输入为空，返回空数组
        return;
    }

    try {
        const response = await searchWallpapers(queryString);
        // 检查 response 是否包含 results，并过滤包含标签的壁纸
        const suggestions = Array.isArray(response)
            ? response
                .flatMap(item => {
                    try {
                        const parsedTags = JSON.parse(item.tags); // 解析 tags 字段
                        // 筛选包含输入字符串的标签
                        const filteredTags = parsedTags.filter(tag => tag.includes(queryString));
                        return filteredTags;
                    } catch (error) {
                        console.error('解析 tags 失败:', error);
                        return [];
                    }
                })
                .map(tag => ({
                    value: tag, // 标签本身作为下拉框的值
                }))
            : [];

        const uniqueSuggestions = Array.from(new Set(suggestions.map(tag => tag.value)))
            .map(value => suggestions.find(tag => tag.value === value));
        // 返回建议列表
        callback(uniqueSuggestions); // 返回建议列表
    } catch (error) {
        console.error('Error fetching suggestions:', error);
        callback([]); // 如果出错，返回空数组
    }
};
const handleSearchSelect = (item) => {
    selectedTags.value = item.value; // 更新搜索框的值
    emit('searchChange', item.value); // 将选中的值传递给父组件
};
const handleClear = () => {
    selectedTags.value = ''; // 清空搜索框的值
    emit('searchChange', ''); // 将清空的值传递给父组件
};
// 选中的分辨率
const selectedResolution = ref('');
// 当前选择的分类
const selectedCategory = ref('');
// 搜索框的值
const selectedTags = ref('');
// 选中的类型
const selectedType = ref('computer');
// 向父组件传递分类数据
const emit = defineEmits(['categoryChange', 'resolutionChange', 'searchChange', 'imgCategoryChange']);
const handleCategoryChange = () => {
    emit('categoryChange', selectedCategory.value); // 触发事件，将分类数据传递给父组件
};
const handleimgCategoryChange = () => {
    emit('imgCategoryChange', selectedType.value); // 触发事件，将类型数据传递给父组件
};
// 向父组件传递分辨率数据
const handleResolutionChange = () => {
    emit('resolutionChange', selectedResolution.value); // 触发事件，将分辨率数据传递给父组件

};
onMounted(() => {
    fetchClassifyDetail();
    handleimgCategoryChange();
});
</script>

<template>
    <div class="ColumnSelect">
        <div class="container">
            <div class="ColumnSelectTitle">
                <div class="SelectContent">
                    <h2 style="width: 100px;">分类</h2>
                    <!-- 分类选择器 -->
                    <el-select v-model="selectedCategory" placeholder="选择分类" @change="handleCategoryChange"
                        style="width: 170px;" clearable>
                        <el-option v-for="category in categories" :key="category.value" :label="category.label"
                            :value="category.value" />
                    </el-select>
                </div>
                <div class="SelectContent">
                    <h2 style="width: 100px;">壁纸类型</h2>
                    <!-- 分类选择器 -->
                    <el-select v-model="selectedType" placeholder="选择类型" @change="handleimgCategoryChange"
                        style="width: 170px;">
                        <el-option v-for="item in imgcategory" :key="item.value" :label="item.label"
                            :value="item.value" />
                    </el-select>
                </div>
                <div class="SelectContent">
                    <h2 style="width: 100px;">搜索</h2>
                    <el-autocomplete v-model="selectedTags" placeholder="输入名称" style="width: 170px;" clearable
                        :fetch-suggestions="querySearchAsync" @select="handleSearchSelect" @clear="handleClear" />
                </div>
                <div class="SelectContent">
                    <h2 style="width: 100px;">分辨率</h2>
                    <!-- 分类选择器 -->
                    <el-select v-model="selectedResolution" placeholder="选择分辨率" style="width: 170px;"
                        @change="handleResolutionChange" clearable>
                        <el-option v-for="resolution in resolutions" :key="resolution.value" :label="resolution.label"
                            :value="resolution.value" />
                    </el-select>
                </div>

            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
.ColumnSelect {
    width: 90%;
    margin: auto;
    height: 50%;
    background-color: #fff;
    z-index: 2;

    .ColumnSelectTitle {
        width: 100%;
        height: 50%;
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        justify-content: space-around;
        align-items: center;
        padding: 0 20px;
        background-color: #fff;
    }

    .SelectContent {
        width: 174px;
        height: 68px;
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
        text-align: center;    }
}
</style>