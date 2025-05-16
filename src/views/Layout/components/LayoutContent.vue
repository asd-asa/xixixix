<script setup lang="ts">
import {
  Back,
  DArrowRight,
  Download,
  Refresh,
  RefreshLeft,
  RefreshRight,
  Right,
  ZoomIn,
  ZoomOut,
} from "@element-plus/icons-vue";
import { ref, defineProps, watch } from "vue";
import {downloadWallpapers} from "@/api/wallpapers";

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
  tags?: string[]; 
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
const preloadImage = (url: string) => {
  const img = new Image();
  img.src = url;
};
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
        <div
         class="Content-box"
          v-for="item in wallpapers"
          :key="item.id"
          @mouseenter="(event) => handleMouseEnter(event, item.title)"
          @mouseleave="handleMouseLeave"
        >
          <div v-if="item.media_type === 'computer'" class="Content">
            <img v-img-lazy="item.image_url" :alt="item.title" loading="lazy" />
            <!-- 弹窗 -->
            <div class="Popup">
              <!-- 遍历标签 -->
              <div class="PopupTags">
                <span
                  v-for="(tag, index) in JSON.parse(item.tags)"
                  :key="index"
                >
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
              </div>
            </div>
          </div>
          <div v-else-if="item.media_type === 'avatar'" class="Content-avatar">
            <img v-img-lazy="item.image_url" :alt="item.title" loading="lazy" />
            <div class="Popup">
              <div class="PopupTags">
                <span
                  v-for="(tag, index) in JSON.parse(item.tags)"
                  :key="index"
                >
                  {{ tag }}
                </span>
              </div>
              <div class="PopupContent">
                <h3>{{ item.title }}</h3>
                <p>{{ item.description }}</p>
              </div>
              <div class="PopupSuccess">
                <button @click="gotoImg(item.image)">预览头像</button>
              </div>
            </div>
          </div>
          <div v-else-if="item.media_type === 'unknown'" class="Content">
            <img v-img-lazy="item.image_url" :alt="item.title" loading="lazy" />
            <div class="Popup">
              <div class="PopupTags">
                <span
                  v-for="(tag, index) in JSON.parse(item.tags)"
                  :key="index"
                >
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
          </div>
          <div v-else-if="item.media_type === 'mobile'" class="Content-mobile">
            <img v-img-lazy="item.image_url" :alt="item.title" loading="lazy" />
            <div class="Popup">
              <div class="PopupTags">
                <span
                  v-for="(tag, index) in JSON.parse(item.tags)"
                  :key="index"
                >
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
    .Content-box{
      display: flex;
      justify-content: center;
      align-items: center;
    }

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
    .Content-mobile{
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
    .Content-avatar{
      position: relative;
      width: 200px;
      height: 200px;
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
