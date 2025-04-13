<script setup>
import { defineProps } from 'vue';

// 接收父组件传递的数据
const props = defineProps({
    wallpapers: {
        type: Array,
        required: true,
    }
});
</script>

<template>
    <div class="LayoutContent">
        <div class="container">
            <div class="ContentList">
                <div class="Content" v-for="item in wallpapers" :key="item.id">
                    <img v-img-lazy="item.image" :alt="item.title" />
                    <p>{{ item.title }}</p>
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

    .ContentList {
        padding: 0 20px;
        width: 1165px;
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        grid-gap: 10px;

        .Content {
            width: 100%;
            height: 185px;
            background-color: #fff;
            border-radius: 10px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            margin-bottom: 20px;

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