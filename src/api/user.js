import axios from "axios";
import { getServerUrl, get, post, upload, del } from "@/utils/request.js";
//注册用户
export function getRegisterApi(data) {
  return post("user/register/", data, {
    headers: {
      "Content-Type": "application/json",
    },
  });
}

// 发送验证码（邮箱）
export function sendSmsCode(email) {
  return post(
    "user/send-code/",
    { email },
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
}


// 重置密码（邮箱）
export function resetPassword(email, code, newPassword) {
  return post(
    "user/password-reset/",
    { email, code, new_password: newPassword },
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
}

// 列出所有用户
export function listUsers(params = {}) {
  return get('user/users/', params);
}

// 拉黑或恢复用户（
export function banUser(id, ban = true, uploader = null) {
  // 如果未传入 uploader，则尝试从 localStorage 获取当前用户名（浏览器环境）
  let u = uploader;
  try {
    if (!u && typeof window !== 'undefined') {
      u = localStorage.getItem('username') || '';
    }
  } catch (e) {
    u = u || '';
  }
  return post(`user/users/${id}/ban/`, { ban, uploader: u });
}

// 获取用户收藏列表
export function getFavorites(page = 1, pageSize = 20, mediaType = '', title = '', tags = '') {
  const url = mediaType
    ? `${getServerUrl()}wallpapers/favorites/${mediaType}/`
    : `${getServerUrl()}wallpapers/favorites/`;
  const userrole = window.localStorage.getItem('username') || '';
  const params = { page, pageSize, userrole };
  if (title) params.title = title;
  if (tags) params.tags = tags;
  return axios.get(url, {
    params,
  }).then((response) => response.data);
}

// 获取单张壁纸收藏状态
export function getFavoriteState(wallpaperId) {
  return get(`wallpapers/favorite/${wallpaperId}/favorite/`);
}

// 获取用户浏览记录
export function getHistory(page = 1, pageSize = 20) {
  return get('user/history/', { page, pageSize });
}

// 获取用户下载记录
export function getDownloads(page = 1, pageSize = 20) {
  const userrole = (typeof window !== 'undefined' && localStorage.getItem('username')) || '';
  return get('wallpapers/download-history/', { page, pageSize, userrole });
}

// 获取消息通知
export function getNotifications(limit, offset) {
  return get('user/notifications/', { limit, offset });
}

// 标记单条通知已读
export function markNotificationRead(id) {
  return post(`user/notifications/${id}/read/`);
}

// 标记全部通知已读
export function markAllNotificationsRead() {
  return post('user/notifications/all/read/');
}

// 添加收藏（墙纸 ID）
export function addFavorite(wallpaperId,data) {
  return post(`wallpapers/favorite/${wallpaperId}/favorite/`, data);
}

// 取消收藏（墙纸 ID）
export async function removeFavorite(wallpaperId, data) {
  const formData = data instanceof FormData ? data : new FormData();
  if (!(data instanceof FormData)) {
    formData.append("userrole", window.localStorage.getItem('username') || '');
  }

  const response = await axios.delete(
    `${getServerUrl()}wallpapers/favorite/${wallpaperId}/favorite/`,
    {
      data: formData,
    }
  );
  return response.data;
}
