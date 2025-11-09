<template>
    <div class="box1">
    </div>
    <div class="Header">
        <div class="container">
            <div class="Column">
                <div class="ColumnImg">
                    <img src="@/assets/images/bianmu.png" alt="">
                </div>
                <div class="ColumnTitle">
                    <ul>
                        <li :class="{ active: currentRoute === '/' }">
                            <RouterLink to="/" @click.prevent="updateActiveRoute('/')">
                                <el-icon>
                                    <House />
                                </el-icon>
                                首页
                            </RouterLink>
                        </li>
                        <li :class="{ active: currentRoute === '/phone' }">
                            <RouterLink to="/phone" @click.prevent="updateActiveRoute('/phone')">
                                <el-icon>
                                    <Search />
                                </el-icon>
                                搜索
                            </RouterLink>
                        </li>
                        <li :class="{ active: currentRoute === '/like' }">
                            <RouterLink to="/like" @click.prevent="updateActiveRoute('/like')">
                                <el-icon>
                                    <Star />
                                </el-icon>
                                喜欢
                            </RouterLink>
                        </li>
                        <li :class="{ active: currentRoute === '/my' }" class="box">
                            <RouterLink to="/my" @click.prevent="updateActiveRoute('/my')">
                                <el-icon>
                                    <User />
                                </el-icon>
                                我的
                            </RouterLink>
                        </li>
                        <li :class="{ active: currentRoute === '/setting' }">
                            <RouterLink to="/setting" @click.prevent="updateActiveRoute('/setting')">
                                <el-icon>
                                    <Setting />
                                </el-icon>
                                设置
                            </RouterLink>
                        </li>
                        <li :class="{ active: currentRoute === '/about' }">
                            <RouterLink to="/about" @click.prevent="updateActiveRoute('/about')">
                                <el-icon>
                                    <Warning />
                                </el-icon>
                                关于
                            </RouterLink>
                        </li>
                    </ul>
                </div>
            </div>
        </div>

    </div>

</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const currentRoute = ref('/'); // 默认选中首页
const router = useRouter();

// 更新当前选中的路由
const updateActiveRoute = (path) => {
    currentRoute.value = path;
    router.push(path); // 跳转到对应的路由
};
</script>

<style scoped lang="scss">
.box1 {
    width: 100%;
    height: 60px;
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