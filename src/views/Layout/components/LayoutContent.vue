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
import { ref, defineProps, watch, onMounted, computed, onBeforeUnmount, nextTick } from "vue";
import { downloadWallpapers, deleteWallpapers } from "@/api/wallpapers";

const emit = defineEmits<{ (e: 'refresh'): void; (e: 'loadMore'): void; (e: 'deleted', id: number): void }>();

// 控制弹窗的显示和内容
const showPopup = ref(false); // 是否显示弹窗
const popupContent = ref(""); // 弹窗内容（标签名）
const popupPosition = ref({ x: 0, y: 0 }); // 弹窗位置
const srcList = ref([]); // 存储图片地址列表
// 全屏预览相关状态
const showPreview = ref(false); // 是否显示全屏预览
const previewImage = ref(""); // 当前预览的图片
interface Wallpaper {
  id: number;
  image: string;
  image_url: string; // 图片地址
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
    // 直接从 props 初始化 srcList
    srcList.value = newWallpapers.map((item) => item.image);
  },
  { immediate: true }
);
// 新增：把 mobile 与其他类型分开
const masonryWallpapers = computed(() => props.wallpapers?.filter(p => p.media_type === 'mobile') || []);
const unknownWallpapers = computed(() => props.wallpapers?.filter(p =>  p.media_type === 'unknown') || []);
const otherWallpapers = computed(() => props.wallpapers?.filter(p => p.media_type !== 'mobile' && p.media_type !== 'unknown') || []);
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

// --- JS masonry columns logic ---
const columnCount = ref(3);
// separate columns/heights for mobile and unknown (tablet) to avoid mixing layouts
const columnsMobile = ref<Array<Wallpaper[]>>([]);
const columnHeightsMobile = ref<number[]>([]);
const columnsUnknown = ref<Array<Wallpaper[]>>([]);
const columnHeightsUnknown = ref<number[]>([]);
// store estimated heights per item id so we can remove without reflowing everything
const itemHeights = ref<Record<number, number>>({});
let masonryContainer: HTMLElement | null = null;

const getColumnCount = () => {
  const w = window.innerWidth;
  if (w >= 1000) return 3;
  if (w >= 600) return 2;
  return 1;
};

const initColumns = (count: number, colsRef: any, heightsRef: any) => {
  colsRef.value = Array.from({ length: count }, () => []);
  heightsRef.value = Array.from({ length: count }, () => 0);
};

// Estimate item height by loading image and scaling to column width
const estimateHeight = (item: Wallpaper, colWidth: number) => {
  return new Promise<number>((resolve) => {
    const img = new Image();
    img.onload = () => {
      const naturalW = img.naturalWidth || 1;
      const naturalH = img.naturalHeight || 1;
      const scaledH = (naturalH * colWidth) / naturalW;
      // add approx padding/margins (card padding + gap)
      resolve(scaledH + 20);
    };
    img.onerror = () => resolve(200);
    img.src = item.image_url;
  });
};

// Place a single item into the shortest column
const placeItemTo = async (item: Wallpaper, colsRef: any, heightsRef: any, containerSelector = '.masonry-columns') => {
  if (!masonryContainer) masonryContainer = document.querySelector(containerSelector) as HTMLElement | null;
  const containerWidth = masonryContainer ? masonryContainer.clientWidth : window.innerWidth;
  const gap = 12; // match CSS gap
  const colCount = columnCount.value || 1;
  const colWidth = Math.floor((containerWidth - gap * (colCount - 1)) / colCount);
  const h = await estimateHeight(item, colWidth);
  // find shortest column
  let minIndex = 0;
  let minH = heightsRef.value[0] || 0;
  for (let i = 1; i < heightsRef.value.length; i++) {
    if ((heightsRef.value[i] || 0) < minH) {
      minH = heightsRef.value[i];
      minIndex = i;
    }
  }
  colsRef.value[minIndex].push(item);
  heightsRef.value[minIndex] = (heightsRef.value[minIndex] || 0) + h;
  itemHeights.value[item.id] = h;
};

// Place multiple items (used for initial fill and append)
const placeItemsTo = async (items: Wallpaper[], colsRef: any, heightsRef: any, containerSelector = '.masonry-columns') => {
  for (const it of items) {
    // eslint-disable-next-line no-await-in-loop
    await placeItemTo(it, colsRef, heightsRef, containerSelector);
  }
};

// rebuild columns from scratch (used when column count changes or reset)
const rebuildColumnsFor = async (list: Wallpaper[], colsRef: any, heightsRef: any, containerSelector = '.masonry-columns') => {
  const count = getColumnCount();
  columnCount.value = count;
  initColumns(count, colsRef, heightsRef);
  masonryContainer = document.querySelector(containerSelector) as HTMLElement | null;
  await placeItemsTo(list || [], colsRef, heightsRef, containerSelector);
};

// track previous masonry length to append only new items
let prevMasonryLenMobile = (masonryWallpapers.value && masonryWallpapers.value.length) || 0;
let prevMasonryLenUnknown = (unknownWallpapers.value && unknownWallpapers.value.length) || 0;
// 显示全屏预览
const gotoImg = (image: string) => {
  if (!image) {
    console.error("预览图片路径为空");
    return;
  }

  // 找到当前图片在 srcList 中的索引
  const currentIndex = srcList.value.indexOf(image);

  if (currentIndex === -1) {
    console.error("图片未找到:", image);
    return;
  }

  // 预加载下一张图片
  const nextIndex = (currentIndex + 1) % srcList.value.length;
  preloadImage(srcList.value[nextIndex]);
  // 动态调整 srcList 的顺序
  srcList.value = [
    ...srcList.value.slice(currentIndex),
    ...srcList.value.slice(0, currentIndex),
  ];

  // 设置当前预览的图片
  previewImage.value = image;
  showPreview.value = true; // 显示全屏预览
};
// 新增：权限判断
const isAdmin = ref(false);

// 无限滚动变量（仅对 masonry 区生效）
let scrollContainer: HTMLElement | null = null;
let scrollTimer: number | null = null;
const loadingMore = ref(false);
const prevLen = ref((props.wallpapers && props.wallpapers.length) || 0);
// 触发加载的滚动比例（达到该比例时触发 loadMore），0.5 = 50%
const loadTriggerRatio = 0.5;

// attach / detach scroll listener helpers
const attachScroll = async () => {
  // update admin flag
  const role = localStorage.getItem("role") || localStorage.getItem("username");
  isAdmin.value = role === "admin";

  // find scroll container each time to handle DOM changes
  // 等待 DOM 更新，确保 el-scrollbar__wrap 已经渲染
  await nextTick();
  scrollContainer = document.querySelector('.el-scrollbar__wrap') as HTMLElement | null;
  if (scrollContainer) {
    scrollContainer.removeEventListener('scroll', onScroll);
    scrollContainer.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  } else {
    window.removeEventListener('scroll', onScroll);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
};

const detachScroll = () => {
  if (scrollContainer) {
    scrollContainer.removeEventListener('scroll', onScroll);
  }
  window.removeEventListener('scroll', onScroll);
  scrollContainer = null;
};

let resizeTimer: number | null = null;
const onResize = () => {
  if (resizeTimer !== null) return;
  resizeTimer = window.setTimeout(async () => {
    resizeTimer && (clearTimeout(resizeTimer), (resizeTimer = null));
    const newCols = getColumnCount();
    if (newCols !== columnCount.value) {
      // rebuild both masonry sets when column count changes
      await rebuildColumnsFor(masonryWallpapers.value || [], columnsMobile, columnHeightsMobile, '.masonry-columns');
      await rebuildColumnsFor(unknownWallpapers.value || [], columnsUnknown, columnHeightsUnknown, '.masonry-columns');
    }
  }, 200);
};

onMounted(async () => {
  await attachScroll();
  // initial build columns for both mobile and unknown lists
  await rebuildColumnsFor(masonryWallpapers.value || [], columnsMobile, columnHeightsMobile, '.masonry-columns');
  await rebuildColumnsFor(unknownWallpapers.value || [], columnsUnknown, columnHeightsUnknown, '.masonry-columns');
  window.addEventListener('resize', onResize, { passive: true });
});

onBeforeUnmount(() => {
  detachScroll();
  window.removeEventListener('resize', onResize);
});

// 基于滚动容器 scrollTop 判断是否接近底部
const onScroll = () => {
  // 节流
  if (scrollTimer !== null) return;
  scrollTimer = window.setTimeout(() => {
      if ((!masonryWallpapers.value || masonryWallpapers.value.length === 0) && (!unknownWallpapers.value || unknownWallpapers.value.length === 0)) {
      clearTimeout(scrollTimer!);
      scrollTimer = null;
      return;
    }

    const sc = scrollContainer || (document.scrollingElement as HTMLElement) || document.documentElement;
    const scrollTop = sc.scrollTop;
    const clientHeight = sc.clientHeight;
    const scrollHeight = sc.scrollHeight;
    const distanceToBottom = scrollHeight - (scrollTop + clientHeight);

    // 计算当前滚动比例（0 - 1），当滚动位置达到或超过 loadTriggerRatio 时提前触发加载
    const maxScrollable = Math.max(scrollHeight - clientHeight, 1);
    const scrollRatio = scrollTop / maxScrollable;

    // 调试输出（出问题时可打开控制台查看）
    // console.log('scrollTop', scrollTop, 'clientHeight', clientHeight, 'scrollHeight', scrollHeight, 'distanceToBottom', distanceToBottom, 'scrollRatio', scrollRatio);

    // 触发条件：达到滚动比例阈值（例如 50%）或仍然接近底部（兼容短页）
    if (!loadingMore.value && (scrollRatio >= loadTriggerRatio || distanceToBottom <= 200)) {
      loadingMore.value = true;
      emit('loadMore');
    }

    clearTimeout(scrollTimer!);
    scrollTimer = null;
  }, 150);
};

// 父组件追加数据后重置 loadingMore
watch(
  () => (props.wallpapers ? props.wallpapers.length : 0),
  (len) => {
    if (len > prevLen.value) {
      loadingMore.value = false;
    }
    prevLen.value = len;
  }
);

// 当 masonry 内容发生变化（如切换壁纸类型）时，重新 attach 滚动容器并重置状态
// watch mobile list
watch(masonryWallpapers, async (list) => {
  await attachScroll();
  const newLen = (list || []).length;
  const currCols = getColumnCount();
  if (newLen < prevMasonryLenMobile || currCols !== columnCount.value) {
    await rebuildColumnsFor(list || [], columnsMobile, columnHeightsMobile, '.masonry-columns');
  } else if (newLen > prevMasonryLenMobile) {
    const newItems = list.slice(prevMasonryLenMobile);
    await placeItemsTo(newItems, columnsMobile, columnHeightsMobile, '.masonry-columns');
  }
  loadingMore.value = false;
  prevMasonryLenMobile = newLen;
});

// watch unknown (tablet) list
watch(unknownWallpapers, async (list) => {
  await attachScroll();
  const newLen = (list || []).length;
  const currCols = getColumnCount();
  if (newLen < prevMasonryLenUnknown || currCols !== columnCount.value) {
    await rebuildColumnsFor(list || [], columnsUnknown, columnHeightsUnknown, '.masonry-columns');
  } else if (newLen > prevMasonryLenUnknown) {
    const newItems = list.slice(prevMasonryLenUnknown);
    await placeItemsTo(newItems, columnsUnknown, columnHeightsUnknown, '.masonry-columns');
  }
  loadingMore.value = false;
  prevMasonryLenUnknown = newLen;
});
// 删除壁纸
const deleteWallpaper = async (id: number) => {
  if (!isAdmin.value) {
    ElMessage.error("只有 admin 可以删除");
    return;
  }
  try {
    const response = await deleteWallpapers(id);
    console.log("删除成功:", response);
    // 先在本地移除：从 columns 中找到对应项并删除，仅调整该列高度，避免重排所有项
    // try mobile columns
    for (let c = 0; c < columnsMobile.value.length; c++) {
      const idx = columnsMobile.value[c].findIndex((it) => it.id === id);
      if (idx !== -1) {
        const h = itemHeights.value[id] || 0;
        columnsMobile.value[c].splice(idx, 1);
        columnHeightsMobile.value[c] = Math.max(0, (columnHeightsMobile.value[c] || 0) - h);
        delete itemHeights.value[id];
        prevMasonryLenMobile = Math.max(0, prevMasonryLenMobile - 1);
        break;
      }
    }
    // try unknown columns
    for (let c = 0; c < columnsUnknown.value.length; c++) {
      const idx = columnsUnknown.value[c].findIndex((it) => it.id === id);
      if (idx !== -1) {
        const h = itemHeights.value[id] || 0;
        columnsUnknown.value[c].splice(idx, 1);
        columnHeightsUnknown.value[c] = Math.max(0, (columnHeightsUnknown.value[c] || 0) - h);
        delete itemHeights.value[id];
        prevMasonryLenUnknown = Math.max(0, prevMasonryLenUnknown - 1);
        break;
      }
    }

    // 通知父组件从 wallpapers 数据中删除该项（父组件只需 filter 掉，不必重新请求全部）
    emit('deleted', id);
  } catch (error) {
    console.error("删除失败:", error);
    ElMessage.error("删除失败，请稍后重试");
  }
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

const download = (index) => {
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
      // 找到当前壁纸
      const wallpaper = props.wallpapers.find(item => item.image === url);
      if (wallpaper) {
        // 调用后端接口，更新下载次数
        downloadWallpapers(wallpaper.id).then(res => {
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

<template>
  <div class="LayoutContent">
      <div class="container">
      <div class="ContentList">
        <!-- 瀑布流（JS 列布局）：mobile 和 unknown 类型 -->
        <div v-if="masonryWallpapers.length" class="masonry-columns">
          <div class="masonry-column" v-for="(col, colIndex) in columnsMobile" :key="colIndex">
            <div class="masonry-item" v-for="item in col" :key="item.id"
              @mouseenter="(event) => handleMouseEnter(event, item.title)" @mouseleave="handleMouseLeave">
              <div class="Content-mobile">
                <img v-img-lazy="item.image_url" :alt="item.title" loading="lazy" />
                <div class="Popup">
                  <div class="PopupTags">
                    <span v-for="(tag, index) in (parseTags(item.tags))" :key="index">
                      {{ tag }}
                    </span>
                  </div>
                  <div class="PopupContent">
                    <h3>{{ item.title }}</h3>
                    <p>{{ item.description }}</p>
                  </div>
                  <div class="PopupSuccess">
                    <button @click="gotoImg(item.image)">预览</button>
                    <button v-if="isAdmin" @click="deleteWallpaper(item.id)" style="margin-top: 5px;">删除</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-if="unknownWallpapers.length" class="masonry-columns">
          <div class="masonry-column" v-for="(col, colIndex) in columnsUnknown" :key="colIndex">
            <div class="masonry-item" v-for="item in col" :key="item.id"
              @mouseenter="(event) => handleMouseEnter(event, item.title)" @mouseleave="handleMouseLeave">
              <div class="Content-mobile">
                <img v-img-lazy="item.image_url" :alt="item.title" loading="lazy" />
                <div class="Popup">
                  <div class="PopupTags">
                    <span v-for="(tag, index) in (parseTags(item.tags))" :key="index">
                      {{ tag }}
                    </span>
                  </div>
                  <div class="PopupContent">
                    <h3>{{ item.title }}</h3>
                    <p>{{ item.description }}</p>
                  </div>
                  <div class="PopupSuccess">
                    <button @click="gotoImg(item.image)">预览</button>
                    <button v-if="isAdmin" @click="deleteWallpaper(item.id)" style="margin-top: 5px;">删除</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

       <div class="grid" v-if="otherWallpapers.length">
        <div class="Content-box" v-for="item in otherWallpapers" :key="item.id"
          @mouseenter="(event) => handleMouseEnter(event, item.title)" @mouseleave="handleMouseLeave">
          <!-- 电脑壁纸 -->
          <div v-if="item.media_type === 'computer'" class="Content">
            <img v-img-lazy="item.image_url" :alt="item.title" loading="lazy" />
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
                <p>{{ item.description }}</p>
                <p>下载次数：{{ item.downloads || 0 }}</p>
              </div>
              <div class="PopupSuccess">
                <button @click="gotoImg(item.image)">预览</button>
                <button v-if="isAdmin" @click="deleteWallpaper(item.id)" style="margin-top: 5px;">删除</button>
              </div>
            </div>
          </div>
          <!-- 头像壁纸 -->
          <div v-else-if="item.media_type === 'avatar'" class="Content-avatar">
            <img v-img-lazy="item.image_url" :alt="item.title" loading="lazy" />
            <div class="Popup">
              <div class="PopupTags">
                <span v-for="(tag, index) in parseTags(item.tags)" :key="index">
                  {{ tag }}
                </span>
              </div>
              <div class="PopupContent">
                <h3>{{ item.title }}</h3>
                <p>{{ item.description }}</p>
              </div>
              <div class="PopupSuccess">
                <button @click="gotoImg(item.image)">预览头像</button>
                <button @click="deleteWallpaper(item.id)" style="margin-top: 5px;">删除</button>
              </div>
            </div>
          </div>
        </div>
      </div>
        <div v-if="showPreview" class="PreviewOverlay">
          <el-image-viewer v-if="showPreview" :url-list="srcList" @close="showPreview = false" show-progress>
            <template #toolbar="{ actions, reset, activeIndex, setActiveItem }">
              <el-icon @click="setActiveItem(srcList.length - 1)">
                <DArrowRight />
              </el-icon>
              <el-icon @click="actions('zoomOut')">
                <ZoomOut />
              </el-icon>
              <el-icon @click="
                actions('zoomIn', { enableTransition: false, zoomRate: 2 })
                ">
                <ZoomIn />
              </el-icon>
              <el-icon @click="
                actions('clockwise', {
                  rotateDeg: 180,
                  enableTransition: false,
                })
                ">
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

<style scoped lang="scss">
.LayoutContent {
  width: 90%;
  margin-top: 15px;
  background-color: #fff;
  margin:  30px auto 0;
  padding: 0 20px;
  .container{
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
  }
    /* 瀑布流样式 */
  /* JS-driven masonry columns */
  .masonry-columns {
    display: flex;
    gap: 12px;
    width: 90%;
    align-items: flex-start;
  }

  .masonry-column {
    flex: 1 1 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .masonry-item {
    width: 100%;
  }
  .Content-mobile {
    background: #fff;
    border-radius: 8px;
    padding: 6px;
    box-shadow: 0 2px 6px rgba(0,0,0,0.08);
    display: block;
    width: 100%;
  }

  // ::v-deep .el-scrollbar__bar,
  // ::v-deep .el-scrollbar__thumb {
  //   display: none !important;
  //   opacity: 0 !important;
  //   pointer-events: none !important;
  // }

  .Content-mobile img {
    width: 100%;
    height: auto;
    display: block;
    border-radius: 6px;
    object-fit: cover;
  }

  /* 响应式：窄屏列数改为 1，宽屏可为 3 列 */
  @media (min-width: 1000px) {
    .masonry { column-count: 3; column-gap: 16px; }
  }
  @media (max-width: 600px) {
    .masonry { column-count: 1; column-gap: 8px; }
  }
  .ContentList {
    padding: 0 20px;
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

    .Content-box {
      display: flex;
      width: 30%;
      margin: 1% 0px 2% 1vw;
      justify-content: center;
      align-items: center;
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
      background-color: #fff;
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
           display: flex;
          flex-direction: column;
          text-align: center;
          margin-top: 10px;

          /* 按钮和描述之间的间距 */
          button {
            cursor: pointer;
            width: 150px;
            background-color: #ece9e9;
            color: #666;
            border: none;
            padding: 10px 20px;
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

    .Content-mobile {
      position: relative;
      height: 100%;
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
           display: flex;
          flex-direction: column;
          text-align: center;
          margin-top: 10px;

          /* 按钮和描述之间的间距 */
          button {
            cursor: pointer;
            width: 150px;
            background-color: #ece9e9;
            color: #666;
            border: none;
            padding: 10px 20px;
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

    .Content-avatar {
       display: flex;
      justify-content: center;
      align-items: center;
      position: relative;
      width: 50%;
      height: 50%;
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
          display: flex;
          flex-direction: column;
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
           display: flex;
          flex-direction: column;
          text-align: center;
          margin-top: 10px;

          /* 按钮和描述之间的间距 */
          button {
            cursor: pointer;
            width: 150px;
            background-color: #ece9e9;
            color: #666;
            border: none;
            padding: 10px 20px;
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
