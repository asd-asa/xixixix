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
