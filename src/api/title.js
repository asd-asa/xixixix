import { get,post,upload,patch,del,} from '@/utils/request.js'

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

// 分类项列表
export function getClassifyItems(params) {
    return get('title/category-item/', params)
}

// 分类项详情
export function getClassifyItemDetail(id, params) {
    return get(`title/category-item/${id}/`, params)
}

// 新增分类项
export function createClassifyItem(data) {
    return post('title/category-item/', data)
}

// 更新分类项
export function updateClassifyItem(id, data) {
    return patch(`title/category-item/${id}/`, data)
}

// 删除分类项
export function deleteClassifyItem(id) {
    return del(`title/category-item/${id}/`)
}
