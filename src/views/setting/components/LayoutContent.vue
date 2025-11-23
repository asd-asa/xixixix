<template>
  <div class="LayoutContent">
    <div class="container">
      <div class="ContentList">
        <div class="grid" v-if="otherWallpapers.length">
          <div
            v-for="item in otherWallpapers"
            :key="item.id"
            :class="
              item.media_type === 'avatar'
                ? 'Content-box-avatar'
                : 'Content-box'
            "
            @mouseenter="(event) => handleMouseEnter(event, item.title)"
            @mouseleave="handleMouseLeave"
          >
            <!-- 头像壁纸 -->
            <div class="Content-avatar">
              <img
                v-img-lazy="item.image_url"
                :alt="item.title"
                loading="lazy"
              />
              <div class="Popup">
                <div class="PopupTags">
                  <span
                    v-for="(tag, index) in parseTags(item.tags)"
                    :key="index"
                  >
                    {{ tag }}
                  </span>
                </div>
                <div class="PopupContent">
                  <h3>{{ item.title }}</h3>
                </div>
                <div class="PopupSuccess">
                  <button @click="gotoImg(item.image)">预览</button>
                  <button @click="deleteWallpaper(item.id)">删除</button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-if="showPreview" class="PreviewOverlay">
          <el-image-viewer
            v-if="showPreview"
            :url-list="srcList"
            @close="showPreview = false"
            show-progress
          >
            <template #toolbar="{ actions, reset, activeIndex, setActiveItem }">
              <el-icon @click="setActiveItem(srcList.length - 1)">
                <DArrowRight />
              </el-icon>
              <el-icon @click="actions('zoomOut')">
                <ZoomOut />
              </el-icon>
              <el-icon
                @click="
                  actions('zoomIn', { enableTransition: false, zoomRate: 2 })
                "
              >
                <ZoomIn />
              </el-icon>
              <el-icon
                @click="
                  actions('clockwise', {
                    rotateDeg: 180,
                    enableTransition: false,
                  })
                "
              >
                <RefreshRight />
              </el-icon>
              <el-icon @click="actions('anticlockwise')">
                <RefreshLeft />
              </el-icon>
              <el-icon @click="reset">
                <Refresh />
              </el-icon>
              <el-icon @click="download(activeIndex)">
                <Download />
              </el-icon>
            </template>
          </el-image-viewer>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  DArrowRight,
  Download,
  Refresh,
  RefreshLeft,
  RefreshRight,
  ZoomIn,
  ZoomOut,
} from "@element-plus/icons-vue";
import { ref, defineProps, watch, computed } from "vue";
import { downloadWallpapers, deleteWallpapers } from "@/api/wallpapers";

const emit = defineEmits<{
  (e: "deleted", id: number): void;
}>();

const showPopup = ref(false);
const popupContent = ref("");
const popupPosition = ref({ x: 0, y: 0 });

const srcList = ref<string[]>([]);
const showPreview = ref(false);
const previewImage = ref("");

interface Wallpaper {
  id: number;
  image: string;
  image_url: string;
  media_type: string;
  title: string;
  description?: string;
  tags?: any;
  downloads?: number;
}

const props = defineProps<{
  wallpapers: Wallpaper[];
}>();

watch(
  () => props.wallpapers,
  (newWallpapers) => {
    srcList.value = (newWallpapers || []).map((item) => item.image);
  },
  { immediate: true }
);

// 这里只保留非 mobile（电脑 + 头像），当前模板实际上只渲染头像样式
const otherWallpapers = computed(() => {
  const wallpapers =
    props.wallpapers?.filter((p) => p.media_type !== "mobile") || [];
  return wallpapers.map((wallpaper) => ({
    ...wallpaper,
    imageLoaded: false,
  }));
});

const preloadImage = (url: string) => {
  const img = new Image();
  img.src = url;
};

const parseTags = (t: any) => {
  try {
    if (!t) return [];
    if (Array.isArray(t)) return t;
    return JSON.parse(t || "[]");
  } catch (e) {
    return [];
  }
};

const gotoImg = (image: string) => {
  if (!image) {
    console.error("预览图片路径为空");
    return;
  }
  const currentIndex = srcList.value.indexOf(image);
  if (currentIndex === -1) {
    console.error("图片未找到:", image);
    return;
  }

  const nextIndex = (currentIndex + 1) % srcList.value.length;
  preloadImage(srcList.value[nextIndex]);

  srcList.value = [
    ...srcList.value.slice(currentIndex),
    ...srcList.value.slice(0, currentIndex),
  ];

  previewImage.value = image;
  showPreview.value = true;
};

const isAdmin = ref(false);
if (typeof window !== "undefined") {
  const role =
    localStorage.getItem("role") || localStorage.getItem("username");
  isAdmin.value = role === "admin";
}

const deleteWallpaper = async (id: number) => {
  if (!isAdmin.value) {
    ElMessage.error("只有 admin 可以删除");
    return;
  }
  try {
    const response = await deleteWallpapers(id);
    if (response.code == 200) {
      ElMessage.success("删除成功");
    }
    emit("deleted", id);
  } catch (error) {
    console.error("删除失败:", error);
    ElMessage.error("删除失败，请稍后重试");
  }
};

const handleMouseEnter = (event: MouseEvent, label: string) => {
  popupContent.value = label;
  popupPosition.value = { x: event.clientX, y: event.clientY };
  showPopup.value = true;
};

const handleMouseLeave = () => {
  showPopup.value = false;
};

const download = (index: number) => {
  const url = srcList.value[index];
  if (!url) {
    console.error("图片 URL 无效:", url);
    return;
  }
  const suffix = url.slice(url.lastIndexOf("."));
  const filename = Date.now() + suffix;

  fetch(url)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP 错误: ${response.status}`);
      }
      return response.blob();
    })
    .then((blob) => {
      const blobUrl = URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      URL.revokeObjectURL(blobUrl);
      link.remove();

      const wallpaper = props.wallpapers.find((item) => item.image === url);
      if (wallpaper) {
        downloadWallpapers(wallpaper.id).then((res: any) => {
          if (res && typeof res.downloads === "number") {
            wallpaper.downloads = res.downloads;
          }
        });
      }
    })
    .catch((error) => {
      console.error("下载失败:", error);
    });
};
</script>

<style scoped lang="scss">
.LayoutContent {
  width: 95%;
  margin-top: 15px;
  background: transparent;
  margin: 0 auto;
  .container {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
  }
  .ContentList {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    .grid {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      align-items: center;
    }
    .Content-box-avatar {
      border-radius: 10px;
      display: flex;
      width: 20%;
      margin: 1% 0px 1% 1vw;
      justify-content: center;
      align-items: center;
      aspect-ratio: 1 / 1;
      overflow: hidden;
    }
    @media (max-width: 1400px) {
      .Content-box-avatar {
        width: 40%;
      }
    }

    @media (max-width: 800px) {
      .Content-box-avatar {
        width: 100%;
      }
    }
    .Content-avatar {
      display: flex;
      justify-content: center;
      align-items: center;
      position: relative;
      width: 70%;
      height: 70%;
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
          width: 100%;
          max-height: 100%;
          margin-bottom: 5px;
          overflow: hidden;
          display: flex;
          justify-content: center;
          align-items: center;
          flex-wrap: wrap;
        }

        .PopupContent {
          display: flex;
          justify-content: space-around;
          width: 70%;
          height: 20%;
          align-items: center;

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
          width: 70%;
          height: 50%;
          display: flex;
          align-items: center;
          gap: 15px;

          /* 按钮和描述之间的间距 */
          button {
            cursor: pointer;
            width: 70%;
            height: 50%;
            background-color: #ece9e9;
            color: #666;
            border: none;
            border-radius: 25px;
            cursor: pointer;
            font-size: 14px;
            transition: background-color 0.3s ease;

            &:hover {
              background-color: #ece9e9;
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

    .Previewimg {
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

      &:active {
        background-color: #d0d0d0;
        pointer-events: auto;
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
