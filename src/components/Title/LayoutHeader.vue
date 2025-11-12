<template>
  <!-- <div class="box1"></div> -->
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
import { ref } from "vue";
import { useRouter } from "vue-router";
import logoMain from '@/assets/images/bianmu.png';
import logoHome from '../../assets/images/luffy.png';

const currentRoute = ref('/'); // 当前路由状态
const currentImg = ref(logoMain);
const router = useRouter();

const handleLogoClick = async () => {
  if (currentRoute.value === '/my') {
    currentRoute.value = '/';
    currentImg.value = logoMain;
    await router.push('/');
  } else {
    currentRoute.value = '/my';
    currentImg.value = logoHome;
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
      height: 48px;
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
