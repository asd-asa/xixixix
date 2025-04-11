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
                <li class="active">
                    <a href="#">
                    <el-icon><House /></el-icon>
                    首页
                    </a>
                </li>
                <li><a href="#">
                    <el-icon><Search /></el-icon>
                    搜索
                </a></li>
                <li><a href="#">
                    <el-icon><Star /></el-icon>
                    喜欢
                </a></li>
                <li class="box"><a href="#">
                    <el-icon><User /></el-icon>
                    我的
                </a></li>
                <li><a href="#">
                    <el-icon><Setting /></el-icon>
                    设置
                </a></li>
                <li><a href="#">
                    <el-icon><Warning /></el-icon>
                    关于
                </a></li>
            </ul>
        </div>
    </div>
    </div>

    </div>
   
</template>

<script setup>

</script>

<style scoped lang="scss">
 .box1{
        width: 100%;
        height: 60px;
    }
.Header {
    position: fixed;
    z-index: 1;
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