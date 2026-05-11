<template>
  <div class="LayoutContent">
      <div class="ContentList">
        <div v-if="masonryWallpapers.length" class="masonry-columns">
          <template v-for="i in columnCount" :key="i">
            <div class="masonry-column">
              <div
                class="masonry-item"
                v-for="item in columnsMobile[i - 1] || []"
                :key="item.id"
                @mouseenter="(event) => handleMouseEnter(event, item.title)"
                @mouseleave="handleMouseLeave"
              >
                <div class="Content-mobile">
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
                      <button v-if="isAdmin" @click="deleteWallpaper(item.id)">
                        删除
                      </button>
                      <button @click="download(item.id)">
                        下载
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>
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
  <div class="imghuiqu">
    <img class="is-loaded" src="../../../assets/static/火箭.png" alt="回到顶部" @click="scrollToTop">
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
import {
  ref,
  defineProps,
  watch,
  onMounted,
  computed,
  onBeforeUnmount,
  nextTick,
} from "vue";
import { useRoute } from "vue-router";
import { downloadWallpapers, deleteWallpapers } from "@/api/wallpapers";


const emit = defineEmits<{
  (e: "refresh"): void;
  (e: "loadMore"): void;
  (e: "deleted", id: number): void;
  (e: "imagesLoaded"): void;
}>();
const overlayVisible = ref(true); // 初始显示蒙版
const overlayHidden = ref(false); // 用于触发 CSS 隐藏过渡
const totalImages = ref(0);
const loadedImages = ref(0);
// 每张图是否已加载的 map，key 为 item.id
const imageLoadedMap = ref<Record<number, boolean>>({});
const preloaderImgs = ref<HTMLImageElement[]>([]); // 用于跟踪并可取消的预加载 Image 对象


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
  // 父组件可选传入：总条数（用于判断是否已到最后一页）
  totalCount?: number;
  // 父组件可选传入：显式标记是否还有更多页
  hasMore?: boolean;
}>();
const route = useRoute();
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
// 新增：把 mobile 与其他类型分开
const masonryWallpapers = computed(() => props.wallpapers);
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

// --- JS 驱动的瀑布列布局逻辑 ---
const getColumnCount = () => {
  const w = window.innerWidth;
  if (w >= 1400) return 4;
  if (w >= 1000) return 3;
  if (w >= 600) return 2;
  return 1;
};

const columnCount = ref(getColumnCount());
const columnsMobile = ref<Array<Wallpaper[]>>([]);
const columnHeightsMobile = ref<number[]>([]);
const itemHeights = ref<Record<number, number>>({});
let masonryContainer: HTMLElement | null = null;

const initColumns = (count: number, colsRef: any, heightsRef: any) => {
  colsRef.value = Array.from({ length: count }, () => []);
  heightsRef.value = Array.from({ length: count }, () => 0);
};

// 通过加载图片并按列宽进行缩放来估算项目高度
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

// 将单个项目放入当前最短的列中
const placeItemTo = async (
  item: Wallpaper,
  colsRef: any,
  heightsRef: any,
  containerSelector = ".masonry-columns"
) => {
  if (!masonryContainer)
    masonryContainer = document.querySelector(
      containerSelector
    ) as HTMLElement | null;
  const containerWidth = masonryContainer
    ? masonryContainer.clientWidth
    : window.innerWidth;
  const gap = 12; // match CSS gap
  const colCount = columnCount.value || 1;
  const colWidth = Math.floor(
    (containerWidth - gap * (colCount - 1)) / colCount
  );
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

// 批量放置项目（用于初始填充和追加）
const placeItemsTo = async (
  items: Wallpaper[],
  colsRef: any,
  heightsRef: any,
  containerSelector = ".masonry-columns"
) => {
  for (const it of items) {
    // eslint-disable-next-line no-await-in-loop
    await placeItemTo(it, colsRef, heightsRef, containerSelector);
  }
};

// 从头重建列（在列数变化或需要重置时使用）
const rebuildColumnsFor = async (
  list: Wallpaper[],
  colsRef: any,
  heightsRef: any,
  containerSelector = ".masonry-columns",
  readyRef: any = null
) => {
  const count = getColumnCount();
  columnCount.value = count;
  initColumns(count, colsRef, heightsRef);
  masonryContainer = document.querySelector(
    containerSelector
  ) as HTMLElement | null;
  await placeItemsTo(list || [], colsRef, heightsRef, containerSelector);
  if (readyRef) readyRef.value = true;
};

// 跟踪上次瀑布流项目长度，仅对新增项进行追加
let prevMasonryLenMobile =
  (masonryWallpapers.value && masonryWallpapers.value.length) || 0;
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
// 新增：权限判断（判断是否为 admin）
const isAdmin = ref(false);

// 无限滚动相关变量（仅对瀑布流区域生效）
let scrollContainer: HTMLElement | null = null;
let scrollTimer: number | null = null;
const loadingMore = ref(false);
const userTriggeredScroll = ref(false);
const prevLen = ref((props.wallpapers && props.wallpapers.length) || 0);
  // 当距离底部小于此像素阈值时触发加载（改为“快到底部以后再加载”）
  const bottomThreshold = 300; // px
  const handleScrollEvent = () => onScroll(true);

// 绑定/解绑滚动监听的辅助函数
const attachScroll = async () => {
  // update admin flag
  const role = localStorage.getItem("role") || localStorage.getItem("username");
  isAdmin.value = role === "admin";

  // find scroll container each time to handle DOM changes
  // 等待 DOM 更新，确保 el-scrollbar__wrap 已经渲染
  await nextTick();
  detachScroll();
  scrollContainer = document.querySelector(
    ".el-scrollbar__wrap"
  ) as HTMLElement | null;
  if (scrollContainer) {
    scrollContainer.addEventListener("scroll", handleScrollEvent, {
      passive: true,
    });
  } else {
    window.addEventListener("scroll", handleScrollEvent, { passive: true });
  }
};

const detachScroll = () => {
  if (scrollContainer) {
    scrollContainer.removeEventListener("scroll", handleScrollEvent);
  }
  window.removeEventListener("scroll", handleScrollEvent);
  scrollContainer = null;
};

let resizeTimer: number | null = null;
// 窗口尺寸变化处理：当列数发生变化时重建列布局
const onResize = () => {
  if (resizeTimer !== null) return;
  resizeTimer = window.setTimeout(async () => {
    resizeTimer && (clearTimeout(resizeTimer), (resizeTimer = null));
    const newCols = getColumnCount();
    if (newCols !== columnCount.value) {
      // rebuild both masonry sets when column count changes
      await rebuildColumnsFor(
        masonryWallpapers.value || [],
        columnsMobile,
        columnHeightsMobile,
        ".masonry-columns"
      );
    }
  }, 200);
};

onMounted(async () => {
  await attachScroll();
  // 初始为 mobile 与 unknown 列构建布局
  await rebuildColumnsFor(
    masonryWallpapers.value || [],
    columnsMobile,
    columnHeightsMobile,
    ".masonry-columns"
  );
  window.addEventListener("resize", onResize, { passive: true });
});

onBeforeUnmount(() => {
  detachScroll();
  window.removeEventListener("resize", onResize);
});

// 基于滚动容器的 scrollTop 判断是否接近底部以触发加载
const onScroll = (isUserInitiated = false) => {
  if (isUserInitiated) {
    userTriggeredScroll.value = true;
  }
  // 节流
  if (scrollTimer !== null) return;
  scrollTimer = window.setTimeout(() => {
    if (
      !masonryWallpapers.value ||
      masonryWallpapers.value.length === 0 ||
      !userTriggeredScroll.value
    ) {
      clearTimeout(scrollTimer!);
      scrollTimer = null;
      return;
    }

    const sc =
      scrollContainer ||
      (document.scrollingElement as HTMLElement) ||
      document.documentElement;
    const scrollTop = sc.scrollTop;
    const clientHeight = sc.clientHeight;
    const scrollHeight = sc.scrollHeight;
    const distanceToBottom = scrollHeight - (scrollTop + clientHeight);

    // 触发条件：仅在接近底部时触发（避免在页面中段过早加载）
    if (!loadingMore.value && distanceToBottom <= bottomThreshold) {
      // 若父组件显式标记无更多则不触发
      if (props.hasMore === false) {
        clearTimeout(scrollTimer!);
        scrollTimer = null;
        return;
      }

      // 若父组件传入 totalCount，且已加载数量 >= totalCount，则认为已到最后一页
      const loadedCount = props.wallpapers ? props.wallpapers.length : 0;
      if (typeof props.totalCount === "number" && loadedCount >= props.totalCount) {
        clearTimeout(scrollTimer!);
        scrollTimer = null;
        return;
      }

      loadingMore.value = true;
      emit("loadMore");
    }
    clearTimeout(scrollTimer!);
    scrollTimer = null;
  }, 150);
};

// 父组件追加数据后重置 loadingMore 标志
watch(
  () => (props.wallpapers ? props.wallpapers.length : 0),
  (len) => {
    if (len > prevLen.value) {
      loadingMore.value = false;
    }
    prevLen.value = len;
  }
);

watch(
  () => route.fullPath,
  () => {
    userTriggeredScroll.value = false;
    loadingMore.value = false;
  }
);

// 当瀑布流内容发生变化（例如切换类型）时，重新绑定滚动容器并重置状态
// 监听 mobile 列表变化
watch(masonryWallpapers, async (list) => {
  await attachScroll();
  const newLen = (list || []).length;
  const currCols = getColumnCount();
  if (newLen < prevMasonryLenMobile || currCols !== columnCount.value) {
    await rebuildColumnsFor(
      list || [],
      columnsMobile,
      columnHeightsMobile,
      ".masonry-columns"
    );
  } else if (newLen > prevMasonryLenMobile) {
    const newItems = list.slice(prevMasonryLenMobile);
    await placeItemsTo(
      newItems,
      columnsMobile,
      columnHeightsMobile,
      ".masonry-columns"
    );
  }
  loadingMore.value = false;
  prevMasonryLenMobile = newLen;
});

// 删除壁纸
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
    const target = props.wallpapers.find((it) => it.id === id);
    if (
      target &&
      (target.media_type === "computer" || target.media_type === "avatar")
    ) {
      emit("refresh");
      return;
    }
    // 先在本地移除：从 columns 中找到对应项并删除，仅调整该列高度，避免重排所有项
    for (let c = 0; c < columnsMobile.value.length; c++) {
      const idx = columnsMobile.value[c].findIndex((it) => it.id === id);
      if (idx !== -1) {
        const h = itemHeights.value[id] || 0;
        columnsMobile.value[c].splice(idx, 1);
        columnHeightsMobile.value[c] = Math.max(
          0,
          (columnHeightsMobile.value[c] || 0) - h
        );
        delete itemHeights.value[id];
        prevMasonryLenMobile = Math.max(0, prevMasonryLenMobile - 1);
        break;
      }
    }

    // 通知父组件从 wallpapers 数据中删除该项（父组件只需 filter 掉，不必重新请求全部）
    emit("deleted", id);
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

// 回到顶部
const scrollToTop = () => {
  const sc =
    scrollContainer ||
    (document.scrollingElement as HTMLElement | null) ||
    document.documentElement ||
    window;
  const scrollFn = (sc as any)?.scrollTo;
  if (typeof scrollFn === "function") {
    scrollFn.call(sc, { top: 0, behavior: "smooth" });
  }
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
    /* 瀑布流样式 */
  /* JS-driven masonry columns */
  .masonry-columns {
    display: flex;
    margin: 1% 0px 1% 1vw;
    width: 95%;
    align-items: flex-start;
  }
  .masonry-column {
    flex: 1 1 0;
    display: flex;
    flex-direction: column;
    margin: 1% 0px 1% 1vw;
  }

  .masonry-item {
    width: 100%;
  }
  @media (min-width: 1000px) {
    .masonry {
      column-count: 3;
      column-gap: 16px;
    }
  }
  @media (max-width: 600px) {
    .masonry {
      column-count: 1;
      column-gap: 8px;
    }
  }

    .Content-mobile {
      display: flex;
      justify-content: center;
      align-items: center;
      position: relative;
      height: 100%;
      width: 100%;
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

      /* 弹窗（深色主题） */
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
          height: 30%;
          display: flex;
          align-items: center;
          gap: 15px;

          button {
            cursor: pointer;
            width: 70%;
            height: 30%;
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
          background-color: rgba(0, 0, 0, 0.56);
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
  /* 更短的过渡与更自然的缓动 */
  transition: filter 420ms cubic-bezier(0.2, 0.9, 0.3, 1),
    transform 420ms cubic-bezier(0.2, 0.9, 0.3, 1), opacity 300ms ease;

  /* 初始占位：模糊 + 缩放 + 流光背景（浅黑色调） */
  filter: blur(10px) saturate(0.95);
  transform: scale(1.04);
  opacity: 0.98;
  background: linear-gradient(90deg, #121212 25%, #1e1e1e 50%, #121212 75%);
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
.imghuiqu {
  position: fixed;
  right: 8px;
  bottom: 80px;     
  width: 60px;
  height: 60px;
  z-index: 1000;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  border-radius: 50%;
  background: rgb(190 246 201 / 24%);
  backdrop-filter: blur(6px);
  box-shadow: 0 8px 20px rgba(83, 180, 241, 0.78);
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;

  &:hover {
    transform: translateY(-4px);
    background: rgba(0, 0, 0, 0.5);
    box-shadow: 0 12px 28px rgba(0, 0, 0, 0.4);
  }
  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
    filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.35));
  }
}
</style>
