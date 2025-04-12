<script setup>
import { ref } from 'vue';
const select = ref(''); // 选择的值

</script>

<template>
    <div class="ColumnSelect">
        <div class="container">
        <div class="ColumnSelectTitle">
            <div class="SelectContent" v-for="item in 6">
                <el-select v-model="select" placeholder="Select" style="width: 170px;" >
                    <el-option label="Restaurant" value="1" />
                    <el-option label="Order No." value="2" />
                    <el-option label="Tel" value="3" />
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
    .ColumnSelectTitle {
        width: 1165px;
        height: 68px;
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        padding: 0 20px;
        background-color: #fff;
    }
}
</style>