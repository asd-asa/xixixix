<script setup>
import { Back, Close, Delete, Download, Right } from '@element-plus/icons-vue';
import { ref, defineProps } from 'vue';

// 接收父组件传递的数据
const props = defineProps({
    wallpapers: {
        type: Array,
        required: true,
    }
});
// 控制弹窗的显示和内容
const showPopup = ref(false); // 是否显示弹窗
const popupContent = ref(''); // 弹窗内容（标签名）
const popupPosition = ref({ x: 0, y: 0 }); // 弹窗位置

// 全屏预览相关状态
const showPreview = ref(false); // 是否显示全屏预览
const previewImage = ref(''); // 当前预览的图片
// 显示全屏预览
const gotoImg = (image) => {
    previewImage.value = image; // 设置当前预览的图片
    showPreview.value = true; // 显示全屏预览
};
// 关闭全屏预览
const closePreview = () => {
    showPreview.value = false; // 隐藏全屏预览
    previewImage.value = ''; // 清空预览图片
};
// 显示弹窗
const handleMouseEnter = (event, label) => {
    popupContent.value = label; // 设置弹窗内容
    popupPosition.value = { x: event.clientX, y: event.clientY }; // 设置弹窗位置
    showPopup.value = true; // 显示弹窗
};

// 隐藏弹窗
const handleMouseLeave = () => {
    showPopup.value = false; // 隐藏弹窗
};
</script>

<template>
    <div class="LayoutContent">
        <div class="container">
            <div class="ContentList">
                <div class="Content" v-for="item in wallpapers" :key="item.id"
                    @mouseenter="(event) => handleMouseEnter(event, item.title)" @mouseleave="handleMouseLeave">
                    <img v-img-lazy="item.image" :alt="item.title" />
                    <!-- 弹窗 -->
                    <div class="Popup">
                        <!-- 遍历标签 -->
                        <div class="PopupTags">
                            <span v-for="(tag, index) in JSON.parse(item.tags)" :key="index">
                                {{ tag }}
                            </span>
                        </div>
                        <div class="PopupContent">
                            <h3>{{ item.title }}</h3>
                            <p>{{ item.description }}</p>
                        </div>
                        <div class="PopupSuccess">
                            <button @click="gotoImg(item.image)">预览</button>
                        </div>
                    </div>
                    <div v-if="showPreview" class="PreviewOverlay">
                        <img :src="previewImage" />
                        <el-button :icon="Close" class="image-close" @click="closePreview" />
                        <div class="image-bar">
                            <el-button-group class="image-bar__btns">
                                <el-button :icon="Back" />
                                <el-button :icon="Download" />
                                <el-button :icon="Right" />
                            </el-button-group>
                        </div>
                    </div>
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
        width: 1200px;
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        grid-gap: 20px;

        .Content {
            width: 100%;
            position: relative;
            height: 220px;
            background-color: #fff;
            border-radius: 10px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            margin-bottom: 20px;
            overflow: hidden;
            transition: transform 0.3s ease, box-shadow 0.3s ease;

            /* 图片悬浮效果 */
            &:hover {
                transform: translateY(-10px);
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
            }

            img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                border-radius: 10px;
            }

            /* 弹窗 */
            .Popup {
                width: 80%;
                /* 弹窗宽度为图片的 70% */
                height: 80%;
                /* 弹窗高度为图片的 70% */
                position: absolute;
                top: 50%;
                /* 定位到图片中心 */
                left: 50%;
                /* 定位到图片中心 */
                transform: translate(-50%, 50%);
                /* 确保中心点对齐 */
                background-color: rgba(255, 255, 255, 0.75);
                color: #1a1919;
                display: flex;
                justify-content: center;
                align-items: center;
                flex-direction: column;
                padding: 10px;
                border-radius: 10px;
                font-size: 14px;
                // pointer-events: none; /* 防止鼠标与弹窗交互 */
                z-index: 10;
                white-space: nowrap;
                opacity: 0;
                /* 初始透明度为 0 */
                transition: transform 0.3s ease, opacity 0.3s ease;

                /* 添加动画效果 */
                /* 鼠标悬浮时启用鼠标事件 */


                span {
                    height: 30px;
                    border: 3px solid #ccc;
                    border-radius: 30px;
                    font-size: 12px;
                    color: #1a1919;
                    margin-bottom: 5px;
                    /* 标签和标题之间的间距 */
                    font-weight: bold;
                    /* 标签加粗 */
                    margin-right: 5px;
                    /* 标签之间的间距 */
                }

                .PopupTags {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    flex-direction: row;
                    flex-wrap: wrap;
                    /* 标签换行 */
                    margin-bottom: 5px;
                    /* 标签和标题之间的间距 */
                }

                .PopupContent {
                    text-align: center;

                    h3 {
                        font-size: 16px;
                        margin-bottom: 5px;
                        /* 标题和描述之间的间距 */
                    }

                    p {
                        font-size: 14px;
                        color: #666;
                    }
                }

                .PopupSuccess {
                    margin-top: 10px;

                    /* 按钮和描述之间的间距 */
                    button {
                        cursor: pointer;
                        width: 150px;
                        background-color: #ECE9E9;
                        color: #666;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 25px;
                        cursor: pointer;
                        font-size: 14px;
                        transition: background-color 0.3s ease;

                        &:hover {
                            background-color: #ECE9E9;
                            /* 悬浮时颜色变化 */
                            pointer-events: auto;
                            /* 启用鼠标事件 */

                        }

                    }
                }
            }

            /* 鼠标悬浮时显示弹窗 */
            &:hover .Popup {
                transform: translate(-50%, -50%);
                /* 放大弹窗 */
                opacity: 1;
                /* 显示弹窗 */
            }
        }
    }

    /* 全屏预览样式 */
    .PreviewOverlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;

        
        img {
            max-width: 90%;
            max-height: 90%;
            object-fit: contain;
            border-radius: 10px;

        }

        .image-close {
            width: 40px;    
            height: 40px;
            position: absolute;
            top: 20px;
            right: 20px;
            color: #fff;
            font-size: 24px;
            font-weight: bold;
            background-color: transparent;
            border: none;
            cursor: pointer;
            z-index: 1001;
            &:hover {
                background-color: #f0f0f0;
                /* 悬浮时颜色变化 */
                pointer-events: auto;
                /* 启用鼠标事件 */
            }

        }

        .image-bar {
            position: absolute;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            justify-content: center;
            align-items: center;
            background-color: rgba(255, 255, 255, 0.8);
            padding: 10px;
            border-radius: 10px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            z-index: 1001;

            .image-bar__btns {
                display: flex;
                justify-content: center;
                align-items: center;
                gap: 10px;

                &:hover {
                    background-color: #f0f0f0;
                    /* 悬浮时颜色变化 */
                    pointer-events: auto;
                    /* 启用鼠标事件 */
                }
            }

            .el-button {
                background-color: #fff;
                color: #000;
                border: none;
                padding: 10px 20px;
                border-radius: 5px;
                cursor: pointer;
                transition: background-color 0.3s ease;

                &:hover {
                    background-color: #f0f0f0;
                    /* 悬浮时颜色变化 */
                    pointer-events: auto;
                    /* 启用鼠标事件 */
                }
            }
        }
    }

}
</style>