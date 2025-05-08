<template>
    <div class="header">

    </div>
    <div class="Header">
        <div class="container">
            <div class="Column">
                <div class="ColumnImg">
                    <img src="@/assets/images/bianmu.png" alt="">
                </div>
                <div class="ColumnTitle">
                    <ul>
                        <li v-for="(item, index) in titles" 
                         :key="item.id"
                         :class="{ active: $route.path === item.path,box: index === 3 }">
                            <RouterLink :to="item.path" >
                                <el-icon v-if="item.icon">
                                    <component :is="icons[item.icon]" />
                                </el-icon>
                                {{item.title}}
                            </RouterLink>
                        </li>
                    </ul>
                </div>
            </div>
        </div>

    </div>

</template>

<script setup>
import {getTitles} from "@/api/title.js";
import {ref, onMounted} from "vue";
import { House, Search, Star, User, Setting, Warning } from '@element-plus/icons-vue';
const icons = {
    House,
    Search,
    Star,
    User,
    Setting,
    Warning
};
const titles = ref([]);
const getTitle = async () => {
    try {
        const res = await getTitles();
        titles.value = res;
    } catch (error) {
        console.error('获取标题失败:', error.message);
        // 可以根据需求添加提示或其他逻辑
    }
};
onMounted(() => {
    getTitle();
});
</script>

<style scoped lang="scss">
.header {
    margin-top: 10px; /* 导航栏的高度 */
    width: 100%;
    height: 50px;
    background-color: #fff;
}
.Header {
    position: fixed;
    z-index: 1000;
    top: 0;
    left: 0;
    width: 100%;
    height: 50px;
    background-color: #f5f5f5;
    border-radius: 10px;
    padding: 0 20px;
    border-bottom: #333 1px solid;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

    .Column {
        width: 1143px;
        margin: 0 auto;
        height: 48px;
        display: flex;
        flex-direction: row;
        background-color: #f5f5f5;

        .ColumnImg {
            width: 100px;
            height: 48px;

            // background-color: #ccc;
            img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }
        }

        .ColumnTitle {
            ul {
                list-style-type: none;
                display: flex;
                align-items: center;

                padding: 0;
                margin: 0;

                li.active {

                    border-bottom: 2px solid blue;

                    a {
                        color: blue;
                    }
                }

                li {
                    display: flex;
                    align-items: center;
                    justify-self: unset;
                    margin-left: 30px;
                    width: 58px;
                    height: 48px;

                    a {
                        // text-decoration: none;
                        color: #333;
                        // font-size: 16px;
                        // &:hover {
                        //     background-color: #e0e0e0;
                        // }
                    }

                    &.box {
                        margin-left: 472px;
                    }
                }
            }
        }
    }
}
</style>