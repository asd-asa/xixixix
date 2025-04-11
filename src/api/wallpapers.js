import { get,post,upload,del,} from '@/utils/request.js'

// 获取壁纸列表
export function getWallpapers(params) {
    return get('wallpapers/wallpapers/', params)
}
// 获取壁纸详情
export function getWallpaperDetail(id) {
    return get('wallpapers/wallpapers/' + id + '/')
}
// 上传壁纸
export function uploadWallpapers(data) {
    return upload('wallpapers/bulk-upload/', data)
}
//壁纸分页
export const getWallpapersPage = (page, pageSize) => {
    return get('wallpapers/wallpapers/page', { page, pageSize });
};