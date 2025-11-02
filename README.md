# Wallpaper Gallery (壁纸画廊)

🎨 一个基于 Vue3 的现代壁纸展示网站，提供高清壁纸浏览、分类和下载功能
壁纸演示网站 http://47.111.126.28/

## ✨ 功能特性

- **动态壁纸展示**
  - 瀑布流布局自动适配
  - 支持懒加载优化性能
  - 高清图片预加载提示
- **智能分类系统**
  - 按主题/颜色/分辨率筛选
  - 热门标签云展示
  - 最近更新板块
- **交互增强**
  - 图片收藏功能（本地存储）
  - 动态下载统计
  - 可视化大图预览模式
- **响应式设计**
  - 完美适配移动端
  - 暗黑模式支持
  - 屏幕尺寸自动适配

## 🚀 快速开始

### 环境要求
- Node.js ≥ 18
- npm ≥ 9

### 安装步骤
```bash
# 克隆仓库
git clone https://github.com/asd-asa/xixixix.git

# 安装依赖
npm install

# 启动开发服务器
npm run dev

🧩 项目结构
wallpaper-gallery/
├── public/               # 静态资源
├── src/
│   ├── assets/           # 全局资源文件
│   ├── components/       # 通用组件
│   │   ├── WallpaperCard.vue
│   │   └── CategoryFilter.vue
│   ├── composables/      # Composition API 逻辑
│   ├── router/           # 路由配置
│   ├── stores/           # Pinia 状态管理
│   ├── styles/           # 全局样式
│   ├── utils/            # 工具函数
│   ├── views/            # 页面组件
│   └── main.js           # 入口文件
├── .env.example          # 环境变量示例
├── vite.config.js        # Vite配置
└── package.json

🖥️ 技术栈
核心框架: Vue 3 + Composition API

构建工具: Vite 5

状态管理: Pinia

路由管理: Vue Router 4

UI 组件: Element Plus

辅助工具:

Axios - 网络请求

Masonry.css - 瀑布流布局

VueUse - 常用工具集

