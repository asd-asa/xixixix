<script setup>
import { onMounted, ref,defineProps } from 'vue';
import { getWallpapers,getWallpapersPage } from '@/api/wallpapers';

// const wallpapers = ref([]);

// const fetchWallpapers = async () => {
//     try {
//         const response = await getWallpapersPage();
//         wallpapers.value = response.results;
//         console.log(response);
        
//     } catch (error) {
//         console.error('Error fetching wallpapers:', error);
//     }
// };
// 获取分页数据
defineProps({
    wallpapers: {
        type: String,
        required: true
    },
    total:{
        type: Number,
        required: true
    }
})

// onMounted(() => {
//     fetchWallpapers();
// });

</script>

<template>
    <div class="LayoutContent">
        <div class="container">
            <div class="ContentList">
                <div class="Content" v-for="item in wallpapers" :key="item.id">
                    <img v-img-lazy="item.image"  :alt="item.title" />
                </div>
            </div>
        </div>

    </div>
</template>

<style scoped lang="scss">
.LayoutContent {
    width: 100%;
    background-color: #fff;
    padding: 0 20px;
    .ContentList{
        padding: 0 20px;
        width: 1165px;
        display: grid;
        grid-template-columns:repeat(4,1fr);
        grid-gap: 10px;
        .Content {
        width: 100%;
        height: 185px;
        background-color: #fff;
        border-radius: 10px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        margin-bottom: 20px;
        // display: flex;
        // justify-content: center;
        // align-items: center;

        img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 10px;
        }
    }
    }
}
</style>