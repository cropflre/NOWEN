import { useState, useEffect, useCallback } from 'react';
import { checkAuthStatus, clearAuthStatus, isDemoMode, adminVerify } from '../lib/api';
import { useHashRouter } from './useHashRouter';
import type { PageType, AdminTabType } from './useHashRouter';

export type { PageType, AdminTabType } from './useHashRouter';

export function useAuth() {
  const { page: currentPage, adminTab, navigateTo, setAdminTab } = useHashRouter();
  const [adminUsername, setAdminUsername] = useState<string>('');
  // 从 localStorage 同步初始化登录状态，避免闪烁和竞态
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    const { isValid } = checkAuthStatus();
    return isValid;
  });
  // force-password-change 不暴露到 URL，用内部状态
  const [forcePasswordChange, setForcePasswordChange] = useState(false);

  // 初始化时检查登录状态（先 localStorage 快速恢复，再后端异步验证）
  useEffect(() => {
    const { isValid, username, requirePasswordChange } = checkAuthStatus();
    if (isValid && username) {
      setIsLoggedIn(true);
      setAdminUsername(username);
      if (requirePasswordChange && !isDemoMode()) {
        setForcePasswordChange(true);
      }

      // 异步向后端验证 Token 是否仍然有效
      adminVerify()
        .then((result) => {
          if (!result.valid) {
            // Token 已失效，清除前端登录状态
            clearAuthStatus();
            setIsLoggedIn(false);
            setAdminUsername('');
            setForcePasswordChange(false);
            if (currentPage === 'admin') {
              navigateTo('admin-login');
            }
          } else if (result.user?.username) {
            // 同步后端最新用户名
            setAdminUsername(result.user.username);
          }
        })
        .catch(() => {
          // 网络错误时不清除登录状态（离线容错），保持本地状态
        });
    }
  }, []);

  // 如果用户通过 URL 直接访问 /#/admin 但未登录，重定向到登录页
  useEffect(() => {
    if (currentPage === 'admin' && !isLoggedIn) {
      // 再次从 localStorage 检查（防止与初始化 useEffect 的竞态）
      const { isValid, username } = checkAuthStatus();
      if (isValid && username) {
        setIsLoggedIn(true);
        setAdminUsername(username);
      } else {
        navigateTo('admin-login');
      }
    }
  }, [currentPage, isLoggedIn, navigateTo]);

  // 检查是否已登录后台
  const checkAdminAuth = useCallback(() => {
    const { isValid, username, requirePasswordChange } = checkAuthStatus();
    if (isValid && username) {
      setAdminUsername(username);
      if (requirePasswordChange && !isDemoMode()) {
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
    if (requirePasswordChange && !isDemoMode()) {
      setForcePasswordChange(true);
      // URL 显示 admin-login，内部渲染密码修改
      navigateTo('admin-login');
    } else {
      navigateTo('admin');
    }
  }, [navigateTo]);

  // 密码修改成功后的处理
  const handlePasswordChangeSuccess = useCallback((newUsername?: string) => {
    if (newUsername) {
      setAdminUsername(newUsername);
    }
    setForcePasswordChange(false);
    navigateTo('admin');
  }, [navigateTo]);

  // 后台退出登录
  const handleAdminLogout = useCallback(() => {
    clearAuthStatus();
    setAdminUsername('');
    setIsLoggedIn(false);
    setForcePasswordChange(false);
    navigateTo('home');
  }, [navigateTo]);

  // 导航到管理页面（带权限检查）
  const navigateToAdmin = useCallback(() => {
    const authResult = checkAdminAuth();
    if (authResult === 'require-password-change') {
      setForcePasswordChange(true);
      navigateTo('admin-login');
    } else if (authResult) {
      navigateTo('admin');
    } else {
      navigateTo('admin-login');
    }
  }, [checkAdminAuth, navigateTo]);

  // 计算实际显示的页面（考虑 forcePasswordChange 内部状态）
  const effectivePage: PageType = forcePasswordChange && isLoggedIn
    ? 'force-password-change'
    : currentPage;

  return {
    currentPage: effectivePage,
    adminTab,
    adminUsername,
    isLoggedIn,
    setCurrentPage: navigateTo,
    setAdminTab,
    handleAdminLogin,
    handlePasswordChangeSuccess,
    handleAdminLogout,
    navigateToAdmin,
  };
}
