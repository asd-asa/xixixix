import { get,post,upload,del,} from '@/utils/request.js'

// 获取标题列表
export function getTitles(params) {
    return get('title/navigation-bar/', params)
}