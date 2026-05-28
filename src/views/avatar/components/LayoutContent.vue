<template>
  <div class="LayoutContent">
    <div class="ContentList">
      <div
        v-for="item in otherWallpapers"
        :key="item.id"
        :class="
          item.media_type === 'avatar' ? 'Content-box-avatar' : 'Content-box'
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
            :class="{ 'is-loaded': imageLoadedMap[item.id] }"
            @load="handleImageLoad(item.id)"
            @error="handleImageLoad(item.id)"
          />
          <div class="Popup">
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
               <button @click="favoriteWallpaper(item.id)">
                收藏
              </button>
              <!-- <button v-if="isAdmin" @click="deleteWallpaper(item.id)">删除</button> -->
              <button @click="download(item.id)">
                下载
              </button>
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
</template>

<script setup lang="ts">
import axios from "axios";
import { getServerUrl } from "@/utils/request.js";
import { ensureAuthenticated } from '@/utils/auth.js';
import {
  DArrowRight,
  Download,
  Refresh,
  RefreshLeft,
  RefreshRight,
  ZoomIn,
  ZoomOut,
} from "@element-plus/icons-vue";
import { ref, watch, computed } from "vue";
import { downloadWallpapers, deleteWallpapers } from "@/api/wallpapers";

const emit = defineEmits(["deleted", "imagesLoaded"]);

const favoriteWallpaper = async (id: number) => {
  if (!ensureAuthenticated()) return;
  try {
    const formData = new FormData();
     const userrole = window.localStorage.getItem('username') || ''
    formData.append("userrole", userrole); // 用户名称

    const response = await axios.post(`${getServerUrl()}wallpapers/favorite/${id}/favorite/`, formData);
    ElMessage.success(response.data?.message || "收藏成功");
  } catch (error) {
    console.error("收藏失败:", error);
    ElMessage.error("收藏失败，请稍后重试");
  }
};

const overlayVisible = ref(true); // 初始显示蒙版
const overlayHidden = ref(false); // 用于触发 CSS 隐藏过渡
const totalImages = ref(0);
const loadedImages = ref(0);
// 每张图是否已加载的 map，key 为 item.id
const imageLoadedMap = ref<Record<number, boolean>>({});
const preloaderImgs = ref<HTMLImageElement[]>([]); // 用于跟踪并可取消的预加载 Image 对象

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

const otherWallpapers = computed(() => props.wallpapers || []);

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

const handleMouseEnter = (event: MouseEvent, label: string) => {
  popupContent.value = label;
  popupPosition.value = { x: event.clientX, y: event.clientY };
  showPopup.value = true;
};

const handleMouseLeave = () => {
  showPopup.value = false;
};

function getBasenameFromUrl(u: string) {
  try {
    return decodeURIComponent(u.split('/').pop() || '');
  } catch (e) {
    return u.split('/').pop() || '';
  }
}

function sanitizeFilename(name: string) {
  if (!name) return '';
  name = name.replace(/[\\/:*?"<>|\u0000-\u001f]/g, '-').trim();
  name = name.replace(/[. ]+$/g, '');
  if (name.length > 100) name = name.slice(0, 100);
  return name;
}

const download = (value: number) => {
  if (!ensureAuthenticated()) return;
  let url = "";
  let wallpaper: any = null;

  // 先尝试按 id 查找（模板传入的是 item.id）
  wallpaper = (props.wallpapers as any).find((item: any) => item.id === value);
  if (wallpaper) {
    if (!wallpaper.image) {
      console.error('wallpaper 缺少 `image` 字段，无法下载:', wallpaper);
      return;
    }
    url = wallpaper.image;
  } else {
    // 若未找到 id，按 srcList 索引处理（预览工具栏会传入 activeIndex）
    url = srcList.value[value];
    if (!url) {
      console.error('图片 URL 无效:', url);
      return;
    }
    wallpaper = (props.wallpapers as any).find((item: any) => item.image === url);
  }

  const idx = url.lastIndexOf('.');
  const suffix = idx !== -1 ? url.slice(idx) : '.jpg';

  // 优先使用标题（非“未命名”），若标题为空则使用 URL 基名；若标题为 "未命名" 则回退到时间戳
  let filenameBase = '';
  const rawTitle = wallpaper && wallpaper.title ? String(wallpaper.title).trim() : '';
  if (rawTitle && rawTitle !== '未命名') {
    filenameBase = sanitizeFilename(rawTitle);
  } else if (!rawTitle) {
    const urlBase = getBasenameFromUrl(url).replace(/\.[^.]+$/, '');
    filenameBase = sanitizeFilename(urlBase);
  }
  if (!filenameBase) filenameBase = String(Date.now());
  const filename = filenameBase + suffix;

  fetch(url)
    .then((response) => {
      if (!response.ok) throw new Error(`HTTP 错误: ${response.status}`);
      return response.blob();
    })
    .then((blob) => {
      const blobUrl = URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      URL.revokeObjectURL(blobUrl);
      link.remove();

      if (wallpaper) {
        downloadWallpapers(wallpaper.id).then((res: any) => {
          if (res && typeof res.downloads === 'number') {
            wallpaper.downloads = res.downloads;
          }
        });
      }
    })
    .catch((error) => {
      console.error('下载失败:', error);
    });
};
</script>

<style scoped lang="scss">
.LayoutContent {
  width: 95%;
  margin-top: 15px;
  background: transparent;
  margin: 0 auto;
  .ContentList {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;

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
      background-color: transparent;
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

      /* 弹窗（深色风格） */
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
          margin-bottom: 5px;
          font-weight: 600;
          margin-right: 5px;
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
              background-color: rgba(0, 0, 0, 0.36);
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
      background-color: rgba(0, 0, 0, 0.55);
      padding: 10px;
      border-radius: 10px;
      box-shadow: 0 6px 18px rgba(0, 0, 0, 0.4);
      z-index: 1001;

      .image-bar__btns {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 10px;
      }

      .el-button {
        background-color: rgba(0, 0, 0, 0.28);
        color: #f3f3f3;
        border: none;
        padding: 10px 20px;
        border-radius: 5px;
        cursor: pointer;
        transition: background-color 0.18s ease, transform 0.12s ease;

        &:hover {
          background-color: rgba(0, 0, 0, 0.36);
          transform: translateY(-2px);
        }
      }
    }
  }
}
.ImagesOverlay {
  position: absolute;
  inset: 0;
  z-index: 1200;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.45), rgba(0, 0, 0, 0.65));
  color: #fff;
  transition: opacity 0.5s ease, transform 0.5s ease;
  opacity: 1;
  pointer-events: all;

  .overlay-inner {
    text-align: center;
    padding: 20px;
    backdrop-filter: blur(6px) saturate(120%);
    border-radius: 12px;
  }
  .spinner {
    width: 44px;
    height: 44px;
    margin: 0 auto 10px;
    border-radius: 50%;
    border: 4px solid rgba(255, 255, 255, 0.15);
    border-top-color: #fff;
    animation: spin 1s linear infinite;
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.4);
  }

  .progress {
    font-size: 14px;
    opacity: 0.95;
  }
}

/* 隐藏过渡（先触发淡出）*/
.ImagesOverlay--hidden {
  opacity: 0;
  transform: translateY(-10px) scale(0.995);
  pointer-events: none;
}
/* 图片加载特效：初始显示渐变占位并带轻微模糊/缩放，加载完成平滑过渡到清晰 */
img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  border-radius: inherit;
  transition: filter 420ms cubic-bezier(0.2, 0.9, 0.3, 1),
    transform 420ms cubic-bezier(0.2, 0.9, 0.3, 1), opacity 300ms ease;

  /* 初始占位：模糊 + 缩放 + 流光背景（深色） */
  filter: blur(10px) saturate(0.95);
  transform: scale(1.04);
  opacity: 0.98;
  background: linear-gradient(90deg, #121212 25%, #1e1e1e 50%, #121212 75%);
  background-size: 200% 100%;
  animation: placeholderShimmer 1.6s linear infinite;
}

img.is-loaded {
  filter: none;
  transform: scale(1);
  opacity: 1;
  background: transparent;
  animation: none;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes placeholderShimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  img,
  .spinner {
    transition: none !important;
    animation: none !important;
  }
}

</style>
