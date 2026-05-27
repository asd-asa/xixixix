import { get, post, upload, del } from "@/utils/request.js";
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
export function getFavorites(page = 1, pageSize = 20) {
  return get('user/favorites/', { page, pageSize });
}

// 获取用户浏览记录
export function getHistory(page = 1, pageSize = 20) {
  return get('user/history/', { page, pageSize });
}

// 获取用户下载记录
export function getDownloads(page = 1, pageSize = 20) {
  return get('user/downloads/', { page, pageSize });
}

// 添加收藏（墙纸 ID）
export function addFavorite(wallpaperId) {
  return post('user/favorites/', { wallpaper: wallpaperId });
}

// 移除收藏（收藏记录 ID）
export function removeFavorite(id) {
  return del(`user/favorites/${id}/`);
}
