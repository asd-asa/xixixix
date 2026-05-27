import { get,post,put,patch,upload,del,} from '@/utils/request.js'


// 上传壁纸
export function uploadWallpapers(data) {
    return upload('wallpapers/bulk-upload/', data)
}
//壁纸分页
export const getWallpapersPage = (category,page, pageSize,resolution,tags,media_type,title) => {
    return get('wallpapers/wallpapers/page/', { resolution,category,page, pageSize,tags,media_type,title});
};
//搜索壁纸
export const searchWallpapers = (tags) => {
    return get('wallpapers/wallpapers/search/', { tags });
};
//下载壁纸
export const downloadWallpapers = (id) => {
    return  (`wallpapers/wallpapers/download/${id}/`);
};
//删除壁纸
export const deleteWallpapers = (id) => {
    return del(`wallpapers/wallpapers/${id}/delete/`);
};

// 获取待审核壁纸列表（后端接口：/wallpapers/pending/）
// 允许按标题/标签一起筛选，便于管理员在审核页搜索
export const getPendingWallpapers = (page, pageSize, title = '', tags = '') => {
    return get('wallpapers/wallpapers/pending/', { page, pageSize, title, tags });
};

// 编辑壁纸（后端接口：/wallpapers/<id>/edit/）
export const editWallpaper = (id, data) => {
    return patch(`wallpapers/wallpapers/${id}/edit/`, data);
};

// 审核壁纸（后端接口：/wallpapers/<id>/review/
export const reviewWallpaper = (id, data) => {
    return post(`wallpapers/wallpapers/${id}/review/`, data);
};
