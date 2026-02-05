import { useState, useEffect, useCallback } from 'react';
import { checkAuthStatus, clearAuthStatus } from '../lib/api';

export type PageType = 'home' | 'admin' | 'admin-login' | 'force-password-change';

export function useAuth() {
  const [currentPage, setCurrentPage] = useState<PageType>('home');
  const [adminUsername, setAdminUsername] = useState<string>('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // 初始化时检查登录状态
  useEffect(() => {
    const { isValid, username, requirePasswordChange } = checkAuthStatus();
    if (isValid && username) {
      setIsLoggedIn(true);
      setAdminUsername(username);
      // 检查是否需要强制修改密码
      if (requirePasswordChange) {
        setCurrentPage('force-password-change');
      }
    }
  }, []);

  // 检查是否已登录后台
  const checkAdminAuth = useCallback(() => {
    const { isValid, username, requirePasswordChange } = checkAuthStatus();
    if (isValid && username) {
      setAdminUsername(username);
      // 如果需要强制修改密码，返回特殊标识
      if (requirePasswordChange) {
        return 'require-password-change';
      }
      return true;
    }
    return false;
  }, []);

  // 后台登录成功
  const handleAdminLogin = useCallback((username: string, requirePasswordChange?: boolean) => {
    setAdminUsername(username);
    setIsLoggedIn(true);
    // 如果需要强制修改密码，跳转到密码修改页面
    if (requirePasswordChange) {
      setCurrentPage('force-password-change');
    } else {
      setCurrentPage('admin');
    }
  }, []);

  // 密码修改成功后的处理
  const handlePasswordChangeSuccess = useCallback(() => {
    setCurrentPage('admin');
  }, []);

  // 后台退出登录
  const handleAdminLogout = useCallback(() => {
    clearAuthStatus();
    setAdminUsername('');
    setIsLoggedIn(false);
    setCurrentPage('home');
  }, []);

  // 导航处理
  const navigateTo = useCallback((page: PageType) => {
    setCurrentPage(page);
  }, []);

  // 导航到管理页面（带权限检查）
  const navigateToAdmin = useCallback(() => {
    const authResult = checkAdminAuth();
    if (authResult === 'require-password-change') {
      setCurrentPage('force-password-change');
    } else if (authResult) {
      setCurrentPage('admin');
    } else {
      setCurrentPage('admin-login');
    }
  }, [checkAdminAuth]);

  return {
    currentPage,
    adminUsername,
    isLoggedIn,
    setCurrentPage: navigateTo,
    handleAdminLogin,
    handlePasswordChangeSuccess,
    handleAdminLogout,
    navigateToAdmin,
  };
}
