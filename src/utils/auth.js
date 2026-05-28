export function ensureAuthenticated() {
  try {
    const token = localStorage.getItem('token');
    if (!token || token === 'undefined' || String(token).trim() === '') {
      // 保持与项目路由一致的登录页路径
      window.location.href = '/login';
      return false;
    }
    return true;
  } catch (e) {
    window.location.href = '/login';
    return false;
  }
}
