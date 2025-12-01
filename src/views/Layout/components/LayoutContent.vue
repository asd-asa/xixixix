<template>
  <div class="LayoutContent">
    <div class="ContentList">
      <div v-for="item in otherWallpapers" :key="item.id" class="Content-box">
        <!-- 电脑壁纸 -->
        <div class="Content">
          <img
            v-img-lazy="item.image_url"
            :alt="item.title"
            loading="lazy"
            :class="{ 'is-loaded': imageLoadedMap[item.id] }"
            @load="handleImageLoad(item.id)"
            @error="handleImageLoad(item.id)"
          />
          <!-- 弹窗 -->
          <div class="Popup">
            <!-- 遍历标签 -->
            <div class="PopupTags">
              <span v-for="(tag, index) in parseTags(item.tags)" :key="index">
                {{ tag }}
              </span>
            </div>
            <div class="PopupContent">
              <h3>{{ item.title }}</h3>
            </div>
            <div class="PopupSuccess">
              <button @click="gotoImg(item.image)">预览</button>
              <button v-if="isAdmin" @click="deleteWallpaper(item.id)">
                删除
              </button>
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
            @click="actions('zoomIn', { enableTransition: false, zoomRate: 2 })"
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

const emit = defineEmits(["deleted", "imagesLoaded"]);

const overlayVisible = ref(true); // 初始显示蒙版
const overlayHidden = ref(false); // 用于触发 CSS 隐藏过渡
const totalImages = ref(0);
const loadedImages = ref(0);
// 每张图是否已加载的 map，key 为 item.id
const imageLoadedMap = ref<Record<number, boolean>>({});
const preloaderImgs = ref<HTMLImageElement[]>([]); // 用于跟踪并可取消的预加载 Image 对象


const srcList = ref([]);
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

// 取消并清理未完成的预加载
function cancelPreload() {
  preloaderImgs.value.forEach((img) => {
    img.onload = null;
    img.onerror = null;
    // 无法真正 abort Image()，但移除回调防止内存泄漏
  });
  preloaderImgs.value = [];
}

// 当所有图片加载或出错后调用
function allLoadedDone() {
  // 给出短延迟以便过渡
  setTimeout(() => {
    overlayHidden.value = true;
    setTimeout(() => {
      overlayVisible.value = false;
      emit("imagesLoaded");
      window.dispatchEvent(new CustomEvent("imagesLoaded"));
    }, 500);
  }, 120);
}
watch(
  () => props.wallpapers,
  (newWallpapers) => {
    // 先清理之前的预加载和状态
    cancelPreload();
    const list = newWallpapers || [];
    totalImages.value = list.length;
    loadedImages.value = 0;
    imageLoadedMap.value = {};

    // 生成 srcList（用于预览）
    srcList.value = list.map((i: any) => i.image);

    if (totalImages.value === 0) {
      hideOverlayImmediate();
      return;
    } else {
      overlayVisible.value = true;
      overlayHidden.value = false;
    }

    // 开始 JS 预加载（独立于模板上的 img load）
    list.forEach((item: any) => {
      const img = new Image();
      preloaderImgs.value.push(img);
      img.onload = () => {
        if (!imageLoadedMap.value[item.id]) {
          imageLoadedMap.value[item.id] = true;
          if (loadedImages.value < totalImages.value) loadedImages.value++;
        }
        if (loadedImages.value >= totalImages.value) allLoadedDone();
      };
      img.onerror = () => {
        // 把失败也当作“已触发”，避免因 1 张坏图卡住蒙版
        if (!imageLoadedMap.value[item.id]) {
          imageLoadedMap.value[item.id] = true;
          if (loadedImages.value < totalImages.value) loadedImages.value++;
        }
        if (loadedImages.value >= totalImages.value) allLoadedDone();
      };
            // 优先用 image_url；若无则用 image 字段
      img.src = item.image_url || item.image || "";
    });
  },
  { immediate: true }
);
// 仍保留对模板 img 的兼容处理（防止指令直接触发）
const handleImageLoad = (id?: number) => {
  // 支持作为直接事件处理（被模板 @load 调用）
  if (typeof id === "number") {
    if (!imageLoadedMap.value[id]) {
      imageLoadedMap.value[id] = true;
      if (loadedImages.value < totalImages.value) loadedImages.value++;
    }
    if (loadedImages.value >= totalImages.value) allLoadedDone();
  }
};
function hideOverlayImmediate() {
  overlayHidden.value = true;
  overlayVisible.value = false;
  emit("imagesLoaded");
}
// 只展示电脑壁纸
const otherWallpapers = computed(() => props.wallpapers || []);

const preloadImage = (url: string) => {
  const img = new Image();
  img.src = url;
};

const parseTags = (tags: any) => {
  try {
    if (!tags) return [];
    if (Array.isArray(tags)) return tags;
    return JSON.parse(tags || "[]");
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
  const role = localStorage.getItem("role") || localStorage.getItem("username");
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
  position: relative;
  margin-top: 15px;
  background: transparent;
  margin: 0 auto;
  .ContentList {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;

    .Content-box {
      border-radius: 10px;
      display: flex;
      width: 30%;
      margin: 1% 0px 1% 1vw;
      justify-content: center;
      align-items: center;
      box-sizing: border-box;
      aspect-ratio: 16 / 10;
      overflow: hidden;
    }
    @media (max-width: 1400px) {
      .Content-box {
        width: 40%;
      }
    }

    @media (max-width: 800px) {
      .Content-box {
        width: 100%;
      }
    }
    .Content {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
      height: 100%;
      position: relative;
      border-radius: 10px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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
        height: 80%;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, 50%);
        background-color: rgba(0, 0, 0, 0.55);
        color: #f3f3f3;
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
        padding: 10px;
        border-radius: 10px;
        font-size: 14px;
        z-index: 10;
        white-space: nowrap;
        opacity: 0;
        transition: transform 0.3s ease, opacity 0.3s ease;

        span {
          height: 30px;
          border: 2px solid rgba(255, 255, 255, 0.12);
          border-radius: 30px;
          font-size: 12px;
          color: #f3f3f3;
          font-weight: 600;
          padding: 0 8px;
          display: inline-flex;
          align-items: center;
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
            background-color: rgba(0, 0, 0, 0.28);
            color: #f3f3f3;
            border: none;
            border-radius: 25px;
            font-size: 14px;
            transition: background-color 0.18s ease, transform 0.12s ease;

            &:hover {
              background-color: rgba(0, 0, 0, 0.56);
              transform: translateY(-2px);
              pointer-events: auto;
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
  }
}
/* 图片加载特效：初始显示渐变占位并带轻微模糊/缩放，加载完成平滑过渡到清晰 */
img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  border-radius: inherit;
  /* 更短的过渡与更自然的缓动 */
  transition: filter 420ms cubic-bezier(0.2, 0.9, 0.3, 1),
    transform 420ms cubic-bezier(0.2, 0.9, 0.3, 1), opacity 300ms ease;

  /* 初始占位：模糊 + 缩放 + 流光背景，提升加载感 */
  filter: blur(10px) saturate(0.95);
  transform: scale(1.04);
  opacity: 0.98;
  background-size: 200% 100%;
  animation: placeholderShimmer 1.6s linear infinite;
}

/* 图片加载完成：清晰、复位缩放并关闭占位动画 */
img.is-loaded {
  filter: none;
  transform: scale(1);
  opacity: 1;
  background: transparent;
  animation: none;
}

/* 旋转动画保留用于蒙版 spinner */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 占位流光动画 */
@keyframes placeholderShimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* 无动画偏好时禁用动画（无障碍友好） */
@media (prefers-reduced-motion: reduce) {
  img,
  .spinner {
    transition: none !important;
    animation: none !important;
  }
}
</style>
