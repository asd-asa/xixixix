<template>
  <div class="ColumnSelect">
    <div class="container">
      <div class="ColumnSelectTitle">
        <div class="SelectContent">
          <!-- 分类选择器 -->
          <el-select
            v-model="selectedCategory"
            placeholder="选择分类"
            @change="handleCategoryChange"
            style="width: 170px"
            clearable
          >
            <el-option
              v-for="category in categories"
              :key="category.value"
              :label="category.label"
              :value="category.value"
            />
          </el-select>
        </div>
        <div class="SelectContent">
          <!-- 分类选择器 -->
          <el-select
            v-model="selectedType"
            placeholder="选择类型"
            @change="handleimgCategoryChange"
            style="width: 170px"
          >
            <el-option
              v-for="item in imgcategory"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </div>
        <div class="SelectContent">
          <el-autocomplete
            v-model="selectedTags"
            placeholder="输入名称"
            style="width: 170px"
            clearable
            :fetch-suggestions="querySearchAsync"
            @select="handleSearchSelect"
            @clear="handleClear"
            @input="handleSearchInput"
          />
        </div>
        <div class="SelectContent">
          <!-- 分类选择器 -->
          <el-select
            v-model="selectedResolution"
            placeholder="选择分辨率"
            style="width: 170px"
            @change="handleResolutionChange"
            clearable
          >
            <el-option
              v-for="resolution in resolutions"
              :key="resolution.value"
              :label="resolution.label"
              :value="resolution.value"
            />
          </el-select>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, defineEmits, onMounted } from "vue";
import { getClassifyDetail } from "@/api/title";
import { searchWallpapers } from "@/api/wallpapers";
import { useRouter } from "vue-router"; 
const router = useRouter();  

const classifyDetail = ref([]); // 分类详情数据

// 分类选项
const categories = ref([]);

// 分辨率选项（按区间分类）
const resolutions = ref([]);

const imgcategory = ref([
  { label: "电脑壁纸", value: "computer" },
  { label: "手机壁纸", value: "mobile" },
  { label: "头像", value: "avatar" },
]);

// 获取分类详情数据
const fetchClassifyDetail = async () => {
  try {
    const response = await getClassifyDetail();
    classifyDetail.value = response;
    categories.value = classifyDetail.value.map((item) => ({
      label: item.name,
      value: item.name,
    }));
    resolutions.value = classifyDetail.value
      .map((item) => ({
        label: item.resolution,
        value: item.resolution,
      }))
      .filter((item) => item.label && item.value);
  } catch (error) {
    console.error("获取分类详情数据失败:", error); // 处理错误
  }
};
// 异步搜索方法
const querySearchAsync = async (queryString, callback) => {
  if (!queryString) {
    callback([]);
    return;
  }
  try {
    const response = await searchWallpapers(queryString);

    // 用接口返回的 title 为建议项；也可追加包含输入的 tags
    const suggestions = Array.isArray(response)
      ? response
          .flatMap((item) => {
            const list = [];
            if (item?.title) list.push(item.title);
            try {
              const tags = JSON.parse(item?.tags || "[]");
              list.push(
                ...tags.filter((tag) => tag && tag.includes(queryString))
              );
            } catch (err) {
              console.error("解析 tags 失败:", err);
            }
            return list;
          })
          .filter(Boolean)
          .map((value) => ({ value }))
      : [];

    const uniqueSuggestions = Array.from(
      new Set(suggestions.map((tag) => tag.value))
    ).map((value) => suggestions.find((tag) => tag.value === value));

    callback(uniqueSuggestions);
  } catch (error) {
    console.error("Error fetching suggestions:", error);
    callback([]);
  }
};

const handleSearchInput = (value) => {
  emit("searchChange", value);
};
// const handleSearchSelect = (item) => {
//   selectedTags.value = item.value; // 更新搜索框的值
//   emit("searchChange", item.value); // 将选中的值传递给父组件
// };
// const handleClear = () => {
//   selectedTags.value = ""; // 清空搜索框的值
//   emit("searchChange", ""); // 将清空的值传递给父组件
// };
// 选中的分辨率
const selectedResolution = ref("");
// 当前选择的分类
const selectedCategory = ref("");
// 搜索框的值
const selectedTags = ref("");
// 选中的类型
const selectedType = ref("mobile");
// 向父组件传递分类数据
const emit = defineEmits([
  "categoryChange",
  "resolutionChange",
  "searchChange",
  "imgCategoryChange",
]);
const handleCategoryChange = () => {
  emit("categoryChange", selectedCategory.value); // 触发事件，将分类数据传递给父组件
};
const handleimgCategoryChange = () => {
if (selectedType.value === "computer") {
    router.push("/");
    return
  }else if (selectedType.value === "avatar") {
    router.push("/avatar");
    return
  }
  emit("imgCategoryChange", selectedType.value); // 触发事件，将类型数据传递给父组件
};
// 向父组件传递分辨率数据
const handleResolutionChange = () => {
  emit("resolutionChange", selectedResolution.value); // 触发事件，将分辨率数据传递给父组件
};
onMounted(() => {
  fetchClassifyDetail();
  handleimgCategoryChange();
});
</script>

<style scoped lang="scss">
.ColumnSelect {
  width: 50%;
  margin: auto;
  margin-top: 10px;
  height: 50%;
  background: transparent;
  background-color: rgba(44, 100, 146, 0.5);
  border-radius: 50px;
  z-index: 2;
  ::v-deep .el-autocomplete .el-input__inner::placeholder {
    color: #fff;
    opacity: 1;
  }
  .ColumnSelectTitle {
    width: 100%;
    height: 50%;
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: space-around;
    align-items: center;
    padding: 0 20px;
    background: transparent;
  }

  .SelectContent {
    h2 {
      color: #fff;
    }
    width: 174px;
    height: 48px;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    text-align: center;
  }
}
</style>
