<script setup>
import { ref,defineEmits } from 'vue';
// 分类选项
const categories = ref([
    { label: '风景', value: '风景' },
    { label: '动漫', value: '动漫' },
    { label: '动物', value: '动物' },
]);
// 分辨率选项（按区间分类）
const resolutions = ref([
    { label: '1K', value: '1K' }, // 1K 分辨率
    { label: '2K', value: '2K' }, // 2K 分辨率
    { label: '4K', value: '4K' }, // 4K 分辨率
    { label: '8K', value: '8K' }, // 8K 分辨率
    { label: '其他', value: '其他' }, // 其他分辨率
]);
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