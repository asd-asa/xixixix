import { get,post,upload,del,} from '@/utils/request.js'

// 获取标题列表
export function getTitles(params) {
    return get('title/navigation-bar/', params)
}
//获取分类列表
export function getClassify(params) {
    return get('title/category-list/', params)
}
//获取分类详情
export function getClassifyDetail(params) {
    return get('title/category-item/', params)
}
