<template>
 <div class="container">
        <div  v-if="showFooter" class="box1">
            <el-pagination
                background
                layout="prev, pager, next"
                :total="total"
                :current-page="currentPage"
                :page-size="pageSize"
                @current-change="handlePageChange"
                @size-change="handlePageSizeChange"/>
            <div class="box2">
                当前共 {{ total }} 张 / {{ totalPages }} 页 跳转至 {{ currentPage }} 页
            </div>
        </div>

    </div>
</template>

<script setup>
import { computed, defineEmits,defineProps } from 'vue'

// 接收父组件传递的数据
const props = defineProps({
    total: {
        type: Number,
        required: true,
    },
    currentPage: {
        type: Number,
        required: true,
    },
    pageSize: {
        type: Number,
        required: true,
    },
    mediaType: {
        type: String,
        default: '',
    },
});
// 定义事件，用于向父组件传递分页变化
const emit = defineEmits(['update-page']); // 定义事件名称
// 总页数
const totalPages = computed(() => Math.ceil(props.total / props.pageSize));
const showFooter = computed(() => !(props.mediaType === 'mobile' || props.mediaType === 'unknown'));
// 处理页码变化
const handlePageChange = (page) => {
    emit('update-page', { page, pageSize: props.pageSize }); // 传递页码变化
};
// 处理每页大小变化
const handlePageSizeChange = (pageSize) => {
    emit('update-page', { page: props.currentPage, pageSize }); // 传递每页大小变化
};
</script>

<style lang="scss" scoped>
.box1 {
    width: 100%;
    height: 10vh;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    padding: 10px;
    .box2 {
        margin-left: 40px;
    }
}
</style>