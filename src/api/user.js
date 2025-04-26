import { get,post,upload,del,} from '@/utils/request.js'
//注册用户
export function getRegisterApi(data) {
    return post('user/register/',data,{
        headers: {
            'Content-Type': 'application/json'
        }
    })
    
    
}