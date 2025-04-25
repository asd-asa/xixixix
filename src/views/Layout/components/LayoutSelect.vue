<script setup>
import { ref,defineEmits,onMounted } from 'vue';
import { getClassifyDetail } from '@/api/title'

const classifyDetail = ref([]); // 分类详情数据

// 分类选项
const categories = ref([]);

// 分辨率选项（按区间分类）
const resolutions = ref([]);
console.log('分类选项:', resolutions.value); // 打印获取到的分类选项

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
        console.log('分类详情数据:', resolutions.value); // 打印获取到的分类详情数据
        
    } catch (error) {
        console.error('获取分类详情数据失败:', error); // 处理错误
    }
};
// 选中的分辨率
const selectedResolution = ref('');
// 当前选择的分类
const selectedCategory = ref('');
// 向父组件传递分类数据
const emit = defineEmits(['categoryChange','resolutionChange']);
const handleCategoryChange = () => {
    emit('categoryChange', selectedCategory.value); // 触发事件，将分类数据传递给父组件
};
// 向父组件传递分辨率数据
const handleResolutionChange = () => {
    emit('resolutionChange', selectedResolution.value); // 触发事件，将分辨率数据传递给父组件

};
onMounted(() => {
    fetchClassifyDetail(); // 组件挂载时获取分类详情数据
});
</script>

<template>
    <div class="ColumnSelect">
        <div class="container">
        <div class="ColumnSelectTitle">
            <div class="SelectContent">
                <h2 style="width: 100px;">分类</h2>
                <!-- 分类选择器 -->
                <el-select
                 v-model="selectedCategory" 
                 placeholder="选择分类"
                  @change="handleCategoryChange" 
                  style="width: 170px;"
                  clearable
                  >
                    <el-option
                     v-for="category in categories"
                     :key="category.value"
                     :label="category.label"
                    :value="category.value"
                />
                </el-select>
            </div>
            <div class="SelectContent">
                <h2 style="width: 100px;">分辨率</h2>
                <!-- 分类选择器 -->
                <el-select
                 v-model="selectedResolution" 
                  placeholder="选择分辨率"
                  style="width: 170px;"
                 @change="handleResolutionChange"
                  clearable
                  >
                    <el-option
                     v-for="resolution in resolutions"
                     :key="resolution.value"
                     :label="resolution.label"
                    :value="resolution.value"
                />
                </el-select>
            </div>
        </div>
      </div>
    </div>
</template>

<style scoped lang="scss">
.ColumnSelect {
    // margin-top: 50px; /* 导航栏的高度 */
    width: 100%;
    height: 68px;
    background-color: #fff;
    z-index: 2;
    margin-bottom: 30px;

    .ColumnSelectTitle {
        width: 1200px;
        height: 68px;
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        padding: 0 20px;
        background-color: #fff;
    }
    .SelectContent{
        width: 174px;
        height: 68px;
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
        text-align: center;
    }
}
</style>