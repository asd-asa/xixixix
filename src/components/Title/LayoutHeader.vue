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
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import logoMain from '@/assets/images/bianmu.png';
import logoHome from '../../assets/images/luffy.png';

const router = useRouter();
const route = useRoute();

// 初始根据当前路由决定显示的图片
const currentRoute = ref(route.path);
const currentImg = ref(route.path === '/my' ? logoHome : logoMain);

// 跟踪路由变化，保持图片与路由一致（刷新后不会错误切换）
watch(
  () => route.path,
  (p) => {
    currentRoute.value = p;
    currentImg.value = p === '/my' ? logoHome : logoMain;
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
      width: 100px;
      cursor: pointer;
      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }
  }
}
</style>
