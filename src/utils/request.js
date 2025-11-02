import axios from 'axios'

// 本地 
let baseURL= 'http://localhost:8000/'

// 线上
// let baseURL= 'http://47.111.126.28:8000/'

// 创建axios实例

const http = axios.create({
    baseURL: baseURL,
    timeout: 5000
  })

//请求白名单
const whiteList = ['user/login/','user/register/','wallpapers/wallpapers/page/','title/category-list/'
    ,'title/category-item/','title/navigation-bar/',"wallpapers/wallpapers/"
]
// 添加请求拦截器
http.interceptors.request.use(
    function (config) {
        // 检查请求 URL 是否在白名单中
        const isWhiteListed = whiteList.some((path) => config.url.includes(path));
        if (isWhiteListed) {
            return config; // 直接返回配置，不添加 Authorization 头
        }

        // 如果不在白名单中，检查 token
        const token = window.localStorage.getItem('token');
        
        if (token && token !== 'undefined' && token !== 'null') {
            config.headers.Authorization = `Bearer ${token}`;
        } else {
            console.warn('未找到 token，阻止请求发送');
            return Promise.reject(new Error('未找到 token，阻止请求发送'));
        }
        return config;
    },
    function (error) {
        return Promise.reject(error);
    }
);

// 添加响应拦截器
http.interceptors.response.use(
    function (response) {
        return response;
    },
    async function (error) {
        if (error.response && error.response.status === 401) {
            const refreshToken = window.localStorage.getItem('refresh_token');

            if (refreshToken) {
                try {
                    const response = await axios.post(`${baseURL}user/login/`, {
                        refresh: refreshToken,
                    });

                    const newAccessToken = response.data.access;
                    if (newAccessToken) {
                        window.localStorage.setItem('token', newAccessToken);

                        error.config.headers.Authorization = `Bearer ${newAccessToken}`;
                        return http(error.config);
                    } else {
                        throw new Error('刷新 token 失败，未返回新的 access token');
                    }
                } catch (refreshError) {
                    console.error('刷新 token 失败:', refreshError);
                    window.localStorage.removeItem('token');
                    window.localStorage.removeItem('refresh_token');
                    window.location.href = '/login';
                }
            } else {
                console.warn('未找到 refresh token，跳转到登录页面');
                window.localStorage.removeItem('token');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);


//封装请求
// get请求
export function get(url, params={}) {
    return new Promise((resolve, reject) => {
        http({
            url:url,
            method: 'get',
            params: params,
        }).then(response => {
            resolve(response.data)
        }).catch(err => {
            reject(err)
        })
    })
}
// post请求
export function post(url,params={}) {
    return new Promise((resolve, reject) => {
        http({
            url:url,
            method: 'post',
            data: params,
        }).then(response => {
            resolve(response.data)
        }).catch(err => {
            reject(err)
        })
    })
}
// 文件上传
export function upload(url, params={}) {
    return new Promise((resolve, reject) => {
        http({
            url:url,
            method: 'post',
            data: params,
            headers: {'Content-Type': 'multipart/form-data'}
        }).then(response => {
            resolve(response.data)
        }).catch(err => {
            reject(err)
        })
    })
}
// delete请求
export function del(url, params={}) {
    return new Promise((resolve, reject) => {
        http({
            url:url,
            method: 'delete',
            data: params,
        }).then(response => {
            resolve(response.data)
        }).catch(err => {
            reject(err)
        })
    })
}
export function getServerUrl() {
    return baseURL
}
export default{
    get,
    post,
    upload,
    del,
    getServerUrl
}