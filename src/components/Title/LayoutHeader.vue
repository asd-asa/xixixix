<template>
  <div class="Header">
    <div class="container">
      <div class="Column">
        <div :class="['ColumnImg', { active: currentRoute === '/my' }]"
             @click="handleLogoClick"
             role="button"
             tabindex="0"
             @keydown.enter="handleLogoClick">
          <img :src="currentImg" alt="logo">
        </div>
        <div v-if="isAdmin" :class="['ColumnImg1', { active: currentRoute.startsWith('/admin') }]"
             @click="Clicksetting"
             role="button"
             tabindex="0"
             @keydown.enter="Clicksetting">
          <img :src="currentImg1" alt="logo">
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from "vue";
import { useRouter, useRoute } from "vue-router";
import logoMain from '@/assets/images/上传壁纸.jpeg';
import logoHome from '../../assets/images/首页.png';
import logoSetting from '../../assets/images/后台管理.jpeg';

const router = useRouter();
const route = useRoute();

// 初始根据当前路由决定显示的图片
const currentRoute = ref(route.path);
const currentImg = ref(route.path === '/my' ? logoHome : logoMain);

// 管理图标：在后台时显示返回首页图标，否则显示后台入口图标
const currentImg1 = ref(route.path.startsWith('/admin') ? logoHome : logoSetting);

// 跟踪路由变化，保持图片与路由一致（刷新后不会错误切换）
watch(
  () => route.path,
  (p) => {
    currentRoute.value = p;
    currentImg.value = p === '/my' ? logoHome : logoMain;
  }
);

watch(
  () => route.path,
  (p) => {
    currentImg1.value = p.startsWith('/admin') ? logoHome : logoSetting;
  }
);

const handleLogoClick = async () => {
  // 只负责导航，图片/状态由上面的 watch 自动同步
  if (currentRoute.value === '/my') {
    await router.push('/');
  } else {
    await router.push('/my');
  }
};

const isAdmin = ref(false);

const updateIsAdmin = () => {
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const u = JSON.parse(userStr || 'null');
      const r = (u && ( u.username)) || localStorage.getItem('username') || '';
      isAdmin.value = String(r).trim().toLowerCase() === 'admin';
      return;
    }
    const role = ( localStorage.getItem('username') || '').trim().toLowerCase();
    isAdmin.value = role === 'admin';
  } catch (e) {
    isAdmin.value = false;
  }
};

onMounted(() => {
  updateIsAdmin();
  window.addEventListener('storage', updateIsAdmin);
  window.__cleanupAdminHeaderStorageListener = () => {
    window.removeEventListener('storage', updateIsAdmin);
  };
});

onBeforeUnmount(() => {
  window.__cleanupAdminHeaderStorageListener?.();
  delete window.__cleanupAdminHeaderStorageListener;
});

// 在路由变化时也重新评估（登录后单页内导航也会触发）
watch(
  () => route.path,
  () => {
    updateIsAdmin();
  }
);
// 点击图标：后台<->首页切换
const Clicksetting = async () => {
  // 只负责导航，图片/状态由上面的 watch 自动同步
  if (currentRoute.value.startsWith('/admin')) {
    await router.push('/');
  } else {
    await router.push('/admin/dashboard');
  }
};
</script>

<style scoped lang="scss">
.Header {
  position: fixed;
  z-index: 1000;
  top: 20px;
  right: 0;
  background-color: transparent;
  border-radius: 10px;
  padding: 0 20px;
  .Column {
    display: flex;
    flex-direction: row;
    .ColumnImg {
      /* 桌面默认固定尺寸，保证不会过大 */
      width: 100px;
      height: 100px;
      min-width: 64px;
      min-height: 64px;
      max-width: 220px;
      max-height: 220px;
      cursor: pointer;
      display: inline-block;
      position: fixed;
      top: 0px;
      right: 0px;
      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 50%;
        display: block;
      }
    }
    .ColumnImg1 {
      /* 桌面默认固定尺寸，保证不会过大 */
      width: 100px;
      height: 100px;
      min-width: 64px;
      min-height: 64px;
      max-width: 220px;
      max-height: 220px;
      cursor: pointer;
      display: inline-block;
      position: fixed;
      top: 0px;
      left: 0px;
      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 50%;
        display: block;
      }
    }

    /* 平板（及小屏桌面）使用百分比宽度适配容器 */
    @media (max-width: 1400px) {
      .ColumnImg {
        width: 9%;
        height: auto;
        max-width: 180px;
      }
      .ColumnImg1 {
        width: 9%;
        height: auto;
        max-width: 180px;
      }
    }

    /* 手机及更小屏幕 */
    @media (max-width: 800px) {
      .ColumnImg .ColumnImg1{
        width: 16%;
        height: auto;
        max-width: 140px;
      }
    }

    /* 手机横屏（短高）进一步调整，避免占用过多垂直空间 */
    @media (orientation: landscape) and (max-height: 390px) {
      .ColumnImg .ColumnImg1{
        width: 18%;
        height: auto;
        max-width: 160px;
      }
    }
    /* 手机竖屏（狭窄屏）适当放大以确保可点击性 */
    @media (orientation: portrait) and (max-width: 390px) {
      .ColumnImg .ColumnImg1{
        width: 20%;
        height: auto;
        max-width: 160px;
      }
    }
  }
}
</style>
