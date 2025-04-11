import axios from 'axios'

let baseURL= 'http://localhost:8000/'

// 创建axios实例

const http = axios.create({
    baseURL: baseURL,
    timeout: 3000
  })

// 添加请求拦截器
http.interceptors.request.use(function (config) {
    config.headers.AUTHORIZATION = window.sessionStorage.getItem('token')
    // config.headers.AUTHORIZATION = window.localStorage.getItem('token')
    return config;
  }, function (error) {
    // 对请求错误做些什么
    return Promise.reject(error);
  });

// 添加响应拦截器
http.interceptors.response.use(function (response) {
    // 2xx 范围内的状态码都会触发该函数。
    // 对响应数据做点什么
    return response;
  }, function (error) {
    // 超出 2xx 范围的状态码都会触发该函数。
    // 对响应错误做点什么
    return Promise.reject(error);
  });

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