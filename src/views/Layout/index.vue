<template>
    <LayoutSelect />
    <LayoutContent :wallpapers="wallpapers" :total="total" />
    <LayoutFoot 
        :total="total"
        @update-wallpapers="handleWallpapersUpdate"
    />
    

</template>

<script setup>
import LayoutSelect from './components/LayoutSelect.vue'
import LayoutContent from './components/LayoutContent.vue'
import LayoutFoot from './components/LayoutFoot.vue'
import { ref } from 'vue'


const wallpapers = ref([]); // 存储壁纸数据
const total = ref(0); // 总条数
// 处理子组件传递的数据
const handleWallpapersUpdate = ({ wallpapers: newWallpapers, total: newTotal }) => {
    wallpapers.value = newWallpapers; // 更新壁纸数据
    total.value = newTotal; // 更新总条数
    // console.log('父组件接收到的数据:', wallpapers.value, total.value);
};


</script>

<style lang="scss" scoped >

</style>