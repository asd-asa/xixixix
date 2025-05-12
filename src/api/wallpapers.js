import { get,post,upload,del,} from '@/utils/request.js'


// 上传壁纸
export function uploadWallpapers(data) {
    return upload('wallpapers/bulk-upload/', data)
}
//壁纸分页
export const getWallpapersPage = (category,page, pageSize,resolution,tags) => {
    return get('wallpapers/wallpapers/page/', { resolution,category,page, pageSize,tags });
};
//搜索壁纸
export const searchWallpapers = (tags) => {
    return get('wallpapers/wallpapers/search/', { tags });
};

