<template>
  <div class="upload-wallpapers">
    <div class="upload-wallpapers__title">图片上传</div>
    <el-form
      status-icon
      label-width="auto"
      class="demo-ruleForm"
    >
      <el-form-item label="图片名称">
        <el-input type="text" autocomplete="off" v-model="title" />
      </el-form-item>
      <el-form-item label="图片分类">
        <el-select
          
          clearable
          v-model="category"
          
          placeholder="图片分类"
        >
          <el-option
            v-for="item in categories"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <!-- <el-form-item label="图片描述">
        <el-input
          type="text"
          autocomplete="off"
          v-model="description"
          placeholder="图片描述"
        />
      </el-form-item> -->
      <el-form-item label="图片标签">
        <el-select
          v-model="tags"
          multiple
          filterable
          allow-create
          default-first-option
          :reserve-keyword="false"
          placeholder="请输入图片标签或选择已有标签"    
        >
          <el-option
            v-for="item in classifyTags"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="图片预览">
        <!-- 限制上传预览区域高度，内容过多时出现内部滚动 -->
        <div class="upload-preview">
          <el-upload
            drag
            multiple
            :limit="10"
            :auto-upload="false"
            list-type="picture-card"
            :file-list="selectedFiles"
            :on-change="handleFileChange"
            :on-remove="handleFileRemove"
            :on-preview="handleFilePreview"
            :on-exceed="handleFileExceed"
            accept="image/*"
          >
            <el-icon>
              <Plus />
            </el-icon>
          </el-upload>

          <!-- 图片预览对话框 -->
          <el-dialog v-model="dialogVisible" title="图片预览">
            <img :src="previewImage" style="width: 100%" alt="Preview Image" />
          </el-dialog>
        </div>
      </el-form-item>
      <div class="upload-wallpapers__btns">
        <el-button type="primary" @click="debouncedHandleFileUpload"
          >上传图片</el-button
        >
        <el-button type="danger" @click="resetUpload" 
          >重置</el-button
        >
        <!-- 退出登录 -->
        <el-button
          type="warning"
          @click="logout"
          v-if="hasToken"
          >退出登录</el-button
        >
      </div>
    </el-form>
  </div>
</template>

<script setup lang="ts">
//上传多张图片
import { onMounted, ref } from "vue";
import { uploadWallpapers } from "@/api/wallpapers";
import { getClassifyDetail } from "@/api/title";
import { ElMessage } from "element-plus";
import { ElLoading } from "element-plus";

const categories = ref([]); // 分类选项
const classifyDetail = ref([]); // 分类详情数据
const classifyTags = ref([]); // 分类标签
const selectedFiles = ref([]); // 存储选中的文件
const category = ref(""); // 分类字段
const title = ref(""); // 图片名称
const description = ref(""); // 图片描述
const tags = ref<string[]>([]); // 图片标签（数组）
// 图片预览相关
const dialogVisible = ref(false);
const previewImage = ref("");
// 获取分类详情数据
const fetchClassifyDetail = async () => {
  try {
    const response = await getClassifyDetail();
    classifyDetail.value = response;
    categories.value = classifyDetail.value.map((item) => ({
      label: item.name,
      value: item.name,
    }));
    classifyTags.value = classifyDetail.value.map((item) => ({
      label: item.tags,
      value: item.tags,
    }));
  } catch (error) {
    console.error("获取分类详情数据失败:", error); // 处理错误
  }
};
// 处理文件选择
const handleFileChange = (file, fileList) => {
  selectedFiles.value = fileList.map((item) => ({
    name: item.name,
    size: item.size,
    status: item.status,
    percentage: item.percentage,
    url: item.url || URL.createObjectURL(item.raw), // 使用 url 或生成的 URL
    raw: item.raw, // 原始文件对象
  }));
};
// 处理文件移除
const handleFileRemove = (file, fileList) => {
  selectedFiles.value = fileList; // 更新选中的文件列表
  // 更新预览图片
  if (previewImage.value === file.url || previewImage.value === file.raw.url) {
    previewImage.value = ""; // 清空预览图片
    dialogVisible.value = false; // 关闭预览对话框
  }
};
// 处理文件预览
const handleFilePreview = (file) => {
  previewImage.value = file.url || URL.createObjectURL(file.raw);
  dialogVisible.value = true;
};

// 处理超出数量限制
const handleFileExceed = (files, fileList) => {
  ElMessage.warning(`最多只能上传 10 张图片`);
};

// 清空表单和状态
const resetForm = () => {
  selectedFiles.value = [];
  category.value = "";
  title.value = "";
  description.value = "";
  tags.value = [];
  dialogVisible.value = false;
  previewImage.value = "";
};

// 上传文件
const handleFileUpload = async () => {
  if (selectedFiles.value.length === 0) {
    ElMessage.warning("上传区域为空，请先选择图片");
    return;
  }

  const loading = ElLoading.service({
    lock: true,
    text: "Loading",
    background: "rgba(0, 0, 0, 0.7)",
  });

  const formData = new FormData();
  selectedFiles.value.forEach((file) => {
    formData.append("images", file.raw); // 使用原始文件对象
  });
  // 添加其他字段
  formData.append("category", category.value || "未分类"); // 分类字段
  formData.append("title", title.value || "未命名"); // 图片标题字段
  // formData.append("description", description.value || ""); // 图片描述字段
  formData.append("tags", JSON.stringify(tags.value)); // 将标签数组转换为 JSON 字符串
  formData.append("userrole", localStorage.getItem("username") || ""); // 用户名称
  try {
    const response = await uploadWallpapers(formData);
    ElMessage.success("上传成功");
    // 假设后端返回的响应中包含压缩后的图片 URL
    if (response && response.data) {
      const uploadedImages = response.data.map((item) => ({
        image: item.image, // 原始图片 URL
        image_url: item.image_url,
      }));
    }
    // 处理上传成功后的逻辑，比如清空文件选择框、显示提示等
    resetForm(); // 调用清空表单和状态的函数
  } catch (error) {
    // 检查是否存在 token
    const token = localStorage.getItem("token");
    if (
      !token ||
      token === "undefined" ||
      token === "null" ||
      token.trim() === ""
    ) {
      console.warn("用户未登录，跳转到登录页面");
      // 跳转到登录页面
      window.location.href = "/login"; // 替换为你的登录页面路径
      return;
    }

    // 处理其他上传失败的逻辑，比如显示错误提示等
    const detail =
      error?.response?.data?.detail ||
      error?.response?.data?.message ||
      error?.message ||
      "上传失败";
    ElMessage.error(detail); // 显示错误提示
  } finally {
    loading.close();
  }
};
function debounce(fn, wait = 800, immediate = true) {
  let timer = null;
  return function (...args) {
    const context = this;
    if (timer) clearTimeout(timer);
    const callNow = immediate && !timer;
    timer = setTimeout(() => {
      timer = null;
      if (!immediate) fn.apply(context, args);
    }, wait);
    if (callNow) fn.apply(context, args);
  };
}
const debouncedHandleFileUpload = debounce(handleFileUpload, 800, true);
// 重置上传
const resetUpload = () => {
  selectedFiles.value = [];
};
// 退出登录
const logout = () => {
  // 清除 token 和其他用户信息
  localStorage.removeItem("token");
  localStorage.removeItem("refresh_token");
  // 同时清除登录相关的本地信息（username/role/user/isAdmin）
  try {
    localStorage.removeItem("username");
    localStorage.removeItem("role");
    localStorage.removeItem("user");
    // 如果你还有其它与登录相关的 key，也可以在这里一并清除
  } catch (e) {
    console.warn('logout: unable to clear some localStorage keys', e);
  }
  // 跳转到登录页面
  window.location.href = "/login"; // 替换为你的登录页面路径
};
// 检查是否存在 token
const hasToken = ref(false);
onMounted(() => {
  fetchClassifyDetail();
  // 检查 token 是否存在
  const token = localStorage.getItem("token");
  hasToken.value =
    !!token && token !== "undefined" && token !== "null" && token.trim() !== "";
});
</script>

<style scoped lang="scss">
.upload-wallpapers {
  border-radius: 17px;
  background: rgba(44, 100, 146, 0.5);
  margin-top: 20px;
  /* 移动端优先：默认较窄的容器 */
  width: 90%;
  max-width: 1100px;
  min-height: 60vh;
  margin: 30px auto 0;
  padding: 16px;
  box-sizing: border-box;
  transition: width 240ms ease, padding 200ms ease;
  :deep() {
    .el-form-item__label {
      color: #fff;
    }
  }

  .upload-wallpapers__btns {
    background: transparent;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-top: 24px;
    gap: 12px;
    flex-wrap: wrap;
  }
}

/* 上传预览区域限制高度并启用内部滚动，防止上传列表过长把底部按钮挤出视口 */
.upload-preview {
  /* 使用视口单位保证在不同设备/方向下合理显示 */
  max-height: min(50vh, 360px);
  overflow-y: auto;
  padding: 8px;
  border: 1px solid rgba(0, 0, 0, 0.04);
  border-radius: 6px;
  background: #fff;
  scrollbar-width: thin; /* Firefox: 宽度 */
  scrollbar-color: rgba(0, 0, 0, 0.06) transparent;
}

/* 底部按钮保持可见：在页面滚动时尽量固定在视口底部 */
.upload-wallpapers__btns {
  position: sticky;
  bottom: 0;
  background: #fff; /* 防止覆盖内容可见性问题 */
  padding-top: 12px;
  padding-bottom: 18px;
  z-index: 5;
}

.upload-wallpapers__title {
  font-size: 20px; /* 移动端默认字号 */
  color: #fff;
  text-align: center;
  margin-bottom: 16px;
}

/* 平板及以上 */
@media (min-width: 768px) {
  .upload-wallpapers {
    width: 70%;
    padding: 20px;
    min-height: 60vh;
  }
  .upload-preview {
    max-height: min(60vh, 520px);
  }
  .upload-wallpapers__title {
    font-size: 22px;
  }
}

/* 手机横屏（高度较小）：覆盖平板规则，避免被 768+ 宽度命中 */
@media (max-height: 500px) and (orientation: landscape) {
  .upload-wallpapers {
    width: 70%;
    padding: 12px;
    min-height: 40vh;
  }
  .upload-preview {
    max-height: 55vh;
  }
  .upload-wallpapers__title {
    font-size: 12px;
    margin-bottom: 5px;
  }
   :deep(){
    .el-form-item{
      margin-bottom:  5px;
    }
   }
}

/* 桌面大屏 */
@media (min-width: 1200px) {
  .upload-wallpapers {
    width: 50%;
    padding: 24px;
    min-height: 68vh;
  }
  .upload-preview {
    max-height: min(70vh, 720px);
  }
  .upload-wallpapers__title {
    font-size: 24px;
  }
}

/* 小屏横屏（仅小屏设备） */
@media (max-width: 767px) and (orientation: landscape) {
  .upload-wallpapers {
    width: 80%;
    padding: 12px;
    min-height: 40vh;
  }
  .upload-preview {
    max-height: 60vh;
  }
}

/* 竖屏时确保按钮排列良好 */
@media (max-width: 767px) and (orientation: portrait) {
  .upload-wallpapers__btns {
    flex-direction: column;
    gap: 12px;
  }
}

</style>

