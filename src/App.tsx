import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { DndContext, closestCorners } from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import {
  Pin,
  ExternalLink,
  Edit2,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  Grid3X3,
  StretchHorizontal,
  Minimize2,
  Maximize2,
  Square,
  Lock,
  LibraryBig,
  ArrowRight,
} from "lucide-react";

// API
import { visitsApi, updateSettings } from "./lib/api";

// UI 组件
import { AuroraBackground } from "./components/ui/aurora-background";
import { BentoGrid, BentoGridItem } from "./components/ui/bento-grid";
import { SpotlightCard } from "./components/ui/spotlight-card";
import { FloatingDock } from "./components/ui/floating-dock";
import { MobileFloatingDock } from "./components/ui/mobile-floating-dock";
import { MobileContentNavigation } from "./components/ui/mobile-content-navigation";
import { SpotlightSearch } from "./components/ui/spotlight-search";
import { AiAssistant } from "./components/ui/ai-assistant";
import { Meteors } from "./components/ui/effects";
import { BreathingDot } from "./components/ui/advanced-effects";
import { ScrollToTop } from "./components/ui/scroll-to-top";
import { SidebarNav } from "./components/ui/sidebar-nav";

// 业务组件
import { AddBookmarkModal } from "./components/AddBookmarkModal";
import { BookmarkCardContent } from "./components/BookmarkCardContent";
import { ContextMenu, useBookmarkContextMenu } from "./components/ContextMenu";
import { IconManager } from "./components/IconManager";
import { CategoryEditModal } from "./components/CategoryEditModal";

// 首页子组件
import {
  LiteBackground,
  SortableCard,
  HeroSection,
  ReadLaterSection,
  EmptyState,
  BookmarkDragOverlay,
  AmbientBookmarkStage,
  AMBIENT_SPARSE_BOOKMARK_LIMIT,
} from "./components/home";
import type { AmbientCollectionId } from "./components/home";
import { CloudDrawerHost } from "./components/home/notes/CloudDrawerHost";
import { QuickNotesDrawer } from "./components/home/notes/QuickNotesDrawer";
import { QuickNotesProvider } from "./hooks/QuickNotesContext";
import { CloudDrawerProvider } from "./hooks/CloudDrawerContext";

// 监控组件
import { SystemMonitorCard } from "./components/SystemMonitorCard";
import { HardwareIdentityCard } from "./components/HardwareIdentityCard";
import { VitalSignsCard } from "./components/VitalSignsCard";
import { NetworkTelemetryCard } from "./components/NetworkTelemetryCard";
import { ProcessMatrixCard } from "./components/ProcessMatrixCard";
import { SystemMonitor } from "./components/monitor";

// 页面组件
import { Admin } from "./pages/Admin";
import { AdminLogin } from "./components/AdminLogin";
import { ForcePasswordChange } from "./components/ForcePasswordChange";

// Hooks
import { useBookmarkStore } from "./hooks/useBookmarkStore";
import { useThemeContext } from "./hooks/useTheme";
import { useTime } from "./hooks/useTime";
import { useWeather } from "./hooks/useWeather";
import { useSiteSettings } from "./hooks/useSiteSettings";
import { useDragAndDrop } from "./hooks/useDragAndDrop";
import { useAuth } from "./hooks/useAuth";
import { useNetworkEnv, getBookmarkUrl } from "./hooks/useNetworkEnv";
import { useLazyRender } from "./hooks/useLazyRender";

// 工具函数和类型
import { Bookmark } from "./types/bookmark";
import { IconRenderer } from "./components/IconRenderer";
import { handleQuotesChange } from "./data/quotes";
import { createDockItems, filterDockItems } from "./config/dockItems";
import {
  buildTagStats,
  filterBookmarksByTag,
  getCollectionFromSearch,
  getTagFromSearch,
  normalizeTag,
  writeCollectionToLocation,
  writeTagToLocation,
} from "./lib/bookmark-filter";

const BookmarkLibrary = React.lazy(() =>
  import("./pages/BookmarkLibrary").then((module) => ({ default: module.BookmarkLibrary })),
);

// 标签颜色：基于名称哈希生成柔和的彩色药丸
const TAG_COLORS = [
  { bg: 'rgba(59,130,246,0.12)',  text: 'rgb(96,165,250)',  border: 'rgba(59,130,246,0.25)' },
  { bg: 'rgba(16,185,129,0.12)',  text: 'rgb(52,211,153)',  border: 'rgba(16,185,129,0.25)' },
  { bg: 'rgba(245,158,11,0.12)',  text: 'rgb(251,191,36)',  border: 'rgba(245,158,11,0.25)' },
  { bg: 'rgba(239,68,68,0.12)',   text: 'rgb(248,113,113)', border: 'rgba(239,68,68,0.25)' },
  { bg: 'rgba(139,92,246,0.12)',  text: 'rgb(167,139,250)', border: 'rgba(139,92,246,0.25)' },
  { bg: 'rgba(236,72,153,0.12)',  text: 'rgb(244,114,182)', border: 'rgba(236,72,153,0.25)' },
  { bg: 'rgba(6,182,212,0.12)',   text: 'rgb(34,211,238)',  border: 'rgba(6,182,212,0.25)' },
  { bg: 'rgba(132,204,22,0.12)',  text: 'rgb(163,230,53)',  border: 'rgba(132,204,22,0.25)' },
]
function getTagColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length]
}

function App() {
  // ========== 状态管理 ==========
  const [isSpotlightOpen, setIsSpotlightOpen] = useState(false);
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isQuickNotesDrawerOpen, setIsQuickNotesDrawerOpen] = useState(false);
  const [isIconManagerOpen, setIsIconManagerOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const [editingCategory, setEditingCategory] = useState<import("./types/bookmark").Category | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryModalMode, setCategoryModalMode] = useState<'edit' | 'add'>('edit');
  const [pendingUrl, setPendingUrl] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(() =>
    typeof window === 'undefined' ? null : getTagFromSearch(window.location.search)
  );
  const [activeCollection, setActiveCollection] = useState<AmbientCollectionId>(() => {
    if (typeof window === 'undefined') return 'all';
    return getTagFromSearch(window.location.search)
      ? 'all'
      : getCollectionFromSearch(window.location.search);
  });

  // 右键菜单状态
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
    bookmark: Bookmark | null;
  }>({ isOpen: false, position: { x: 0, y: 0 }, bookmark: null });

  // ========== 自定义 Hooks ==========
  const { greeting, formattedTime, formattedDate, lunarDate } = useTime();
  const { isDark, toggleDarkMode } = useThemeContext();
  const { t, i18n } = useTranslation();
  const { isInternal } = useNetworkEnv();

  // 站点设置
  const {
    siteSettings,
    setSiteSettings,
    settingsLoaded,
    isLiteMode,
    showWeather,
    showLunar,
    showSearch,
    weatherCity,
    disableGeolocation,
    enableAutoAi,
    menuVisibility,
    widgetVisibility,
    categoryCollapseThreshold,
    categoryInitialShowCount,
    cardViewMode,
    widgetSizeMode,
    accessMode,
    defaultBookmarkVisibility,
    searchEngine,
    enableQuickNotes,
    enableIntranetDownload,
    enableSidebarNav,
    nowenNote,
  } = useSiteSettings();

  const { getMenuItems } = useBookmarkContextMenu({ enableIntranetDownload });

  // 认证状态
  const {
    currentPage,
    adminTab,
    adminUsername,
    isLoggedIn,
    setCurrentPage,
    setAdminTab,
    handleAdminLogin,
    handlePasswordChangeSuccess,
    handleAdminLogout,
    navigateToAdmin,
    navigateToLogin,
  } = useAuth();

  // 书签数据
  const {
    bookmarks,
    categories,
    customIcons,
    isLoading,
    newlyAddedId,
    addBookmark,
    updateBookmark,
    deleteBookmark,
    togglePin,
    toggleReadLater,
    toggleRead,
    reorderBookmarks,
    addCategory,
    appendCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,
    addCustomIcon,
    deleteCustomIcon,
    refreshData,
  } = useBookmarkStore();

  const previousLoginStateRef = React.useRef(isLoggedIn);

  // 登录状态从未登录切换到已登录时，重新拉取私有书签/分类
  useEffect(() => {
    if (!previousLoginStateRef.current && isLoggedIn) {
      refreshData();
    }
    previousLoginStateRef.current = isLoggedIn;
  }, [isLoggedIn, refreshData]);

  // 浏览器前进/后退时恢复 URL 中唯一的筛选状态。
  useEffect(() => {
    const handlePopState = () => {
      const nextTag = getTagFromSearch(window.location.search);
      setActiveTag(nextTag);
      setActiveCollection(nextTag ? 'all' : getCollectionFromSearch(window.location.search));
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // 拖拽功能：筛选状态下禁用，避免局部列表重排污染完整顺序
  const {
    activeBookmark,
    sensors,
    handleDragStart,
    handleDragEnd,
    handleDragCancel,
    measuringConfig,
  } = useDragAndDrop({
    bookmarks,
    reorderBookmarks,
    disabled: !isLoggedIn || Boolean(activeTag) || activeCollection !== 'all',
  });

  // 天气数据
  const { weather, loading: weatherLoading, refresh: refreshWeather } = useWeather(
    showWeather,
    weatherCity,
    disableGeolocation,
    settingsLoaded,
  );

  // 天气城市变更
  const handleWeatherCityChange = useCallback(async (city: string) => {
    const newSettings = { ...siteSettings, weatherCity: city };
    setSiteSettings(newSettings);
    try {
      await updateSettings(newSettings);
    } catch {
      // 静默失败，本地已生效
    }
  }, [siteSettings, setSiteSettings]);

  // 书签卡片视图模式变更
  const handleCardViewModeChange = useCallback(async (mode: 'compact' | 'standard' | 'comfortable') => {
    const newSettings = { ...siteSettings, cardViewMode: mode };
    setSiteSettings(newSettings);
    try {
      await updateSettings(newSettings);
    } catch {
      // 静默失败，本地已生效
    }
  }, [siteSettings, setSiteSettings]);

  // 监控 Widget 尺寸模式变更 (S/M/L)
  const handleWidgetSizeModeChange = useCallback(async (mode: 'S' | 'M' | 'L') => {
    const newSettings = { ...siteSettings, widgetSizeMode: mode };
    setSiteSettings(newSettings);
    try {
      await updateSettings(newSettings);
    } catch {
      // 静默失败，本地已生效
    }
  }, [siteSettings, setSiteSettings]);

  // ========== Dock 配置 ==========
  const toggleLanguage = useCallback(() => {
    const langs = ['zh', 'en', 'ja', 'ko'];
    const idx = langs.indexOf(i18n.language);
    const nextLang = langs[(idx + 1) % langs.length];
    i18n.changeLanguage(nextLang);
  }, [i18n]);

  // 根据每个组件的访问模式和登录状态计算有效的仪表可见性
  const effectiveWidgetVisibility = useMemo(() => {
    if (isLoggedIn) return widgetVisibility
    return {
      ...widgetVisibility,
      systemMonitor: widgetVisibility.systemMonitorAccess === 'private' ? false : widgetVisibility.systemMonitor,
      hardwareIdentity: widgetVisibility.hardwareIdentityAccess === 'private' ? false : widgetVisibility.hardwareIdentity,
      vitalSigns: widgetVisibility.vitalSignsAccess === 'private' ? false : widgetVisibility.vitalSigns,
      networkTelemetry: widgetVisibility.networkTelemetryAccess === 'private' ? false : widgetVisibility.networkTelemetry,
      processMatrix: widgetVisibility.processMatrixAccess === 'private' ? false : widgetVisibility.processMatrix,
      dockMiniMonitor: widgetVisibility.dockMiniMonitorAccess === 'private' ? false : widgetVisibility.dockMiniMonitor,
      mobileTicker: widgetVisibility.mobileTickerAccess === 'private' ? false : widgetVisibility.mobileTicker,
      aiAssistant: widgetVisibility.aiAssistantAccess === 'private' ? false : widgetVisibility.aiAssistant,
    }
  }, [widgetVisibility, isLoggedIn])

  const hasPrimaryWidgets =
    effectiveWidgetVisibility.systemMonitor !== false ||
    effectiveWidgetVisibility.hardwareIdentity !== false ||
    effectiveWidgetVisibility.vitalSigns !== false ||
    effectiveWidgetVisibility.networkTelemetry !== false ||
    effectiveWidgetVisibility.processMatrix !== false;

  const dockItems = createDockItems(
    isDark,
    toggleDarkMode,
    t,
    toggleLanguage,
    handleCardViewModeChange,
    cardViewMode,
    currentPage,
  );
  const effectiveMenuVisibility = useMemo(
    () => ({ ...menuVisibility, searchToggle: showSearch && menuVisibility.searchToggle !== false }),
    [menuVisibility, showSearch]
  );
  const filteredDockItems = filterDockItems(dockItems, effectiveMenuVisibility, effectiveWidgetVisibility, isLoggedIn);

  // ========== 全局快捷键 ==========
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (showSearch) setIsSpotlightOpen(true);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "n") {
        e.preventDefault();
        if (isLoggedIn) setIsAddModalOpen(true);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "j") {
        e.preventDefault();
        if (isLoggedIn && effectiveWidgetVisibility.aiAssistant !== false) {
          setIsAiAssistantOpen(prev => !prev);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLoggedIn, showSearch, effectiveWidgetVisibility.aiAssistant]);

  // ========== Bookmarklet / 外部 URL 唤起：?action=add&url=&title= ==========
  useEffect(() => {
    if (!settingsLoaded) return;
    const search = window.location.search;
    if (!search) return;
    const params = new URLSearchParams(search);
    const action = params.get('action');
    if (action !== 'add') return;

    const targetUrl = params.get('url') || '';
    const targetTitle = params.get('title') || '';

    const cleaned = window.location.pathname + window.location.hash;
    window.history.replaceState({}, '', cleaned);
    setActiveTag(null);
    setActiveCollection('all');

    if (!isLoggedIn) {
      try {
        sessionStorage.setItem('pending_bookmark_add', JSON.stringify({ url: targetUrl, title: targetTitle }));
      } catch {}
      navigateToLogin('home');
      return;
    }

    setPendingUrl(targetUrl);
    if (targetTitle) {
      try {
        sessionStorage.setItem('pending_bookmark_title', targetTitle);
      } catch {}
    }
    setIsAddModalOpen(true);
  }, [settingsLoaded, isLoggedIn, navigateToLogin]);

  // 登录成功后，如果之前因未登录被缓存的 Bookmarklet 请求，恢复出来
  useEffect(() => {
    if (!isLoggedIn) return;
    let raw: string | null = null;
    try {
      raw = sessionStorage.getItem('pending_bookmark_add');
    } catch {}
    if (!raw) return;
    try {
      sessionStorage.removeItem('pending_bookmark_add');
      const { url: targetUrl, title: targetTitle } = JSON.parse(raw) as { url?: string; title?: string };
      if (targetUrl) setPendingUrl(targetUrl);
      if (targetTitle) {
        try { sessionStorage.setItem('pending_bookmark_title', targetTitle); } catch {}
      }
      setIsAddModalOpen(true);
    } catch {}
  }, [isLoggedIn]);

  // ========== 事件处理函数 ==========
  const handleDockClick = (id: string) => {
    switch (id) {
      case "home":
        setCurrentPage("home");
        window.scrollTo({ top: 0, behavior: "smooth" });
        break;
      case "library":
        setCurrentPage("library");
        window.scrollTo({ top: 0, behavior: "smooth" });
        break;
      case "search":
        setIsSpotlightOpen(true);
        break;
      case "ai":
        if (isLoggedIn && effectiveWidgetVisibility.aiAssistant !== false) {
          setIsAiAssistantOpen(true);
        }
        break;
      case "add":
        if (isLoggedIn) setIsAddModalOpen(true);
        break;
      case "notes":
        if (isLoggedIn) setIsQuickNotesDrawerOpen(true);
        break;
      case "admin":
        navigateToAdmin();
        break;
    }
  };

  // 右键菜单处理
  const handleContextMenu = useCallback(
    (e: React.MouseEvent, bookmark: Bookmark) => {
      if (!isLoggedIn) return;
      e.preventDefault();
      e.stopPropagation();
      setContextMenu({
        isOpen: true,
        position: { x: e.clientX, y: e.clientY },
        bookmark,
      });
    },
    [isLoggedIn]
  );

  const closeContextMenu = useCallback(() => {
    setContextMenu((prev) => ({ ...prev, isOpen: false }));
  }, []);

  // 书签操作
  const handleAddFromSpotlight = useCallback((url: string) => {
    setPendingUrl(url);
    setIsAddModalOpen(true);
    setIsSpotlightOpen(false);
  }, []);

  const handleSaveBookmark = useCallback(
    async (data: Omit<Bookmark, "id" | "orderIndex" | "createdAt" | "updatedAt">) => {
      try {
        if (editingBookmark) {
          await updateBookmark(editingBookmark.id, data);
        } else {
          await addBookmark(data);
        }
        await refreshData();
      } catch (err) {
        console.error('保存书签失败:', err);
      }
      setEditingBookmark(null);
      setPendingUrl("");
    },
    [editingBookmark, updateBookmark, addBookmark, refreshData]
  );

  const handleDelete = useCallback(
    (id: string) => {
      if (confirm(t('bookmark.delete_confirm'))) {
        deleteBookmark(id);
      }
    },
    [deleteBookmark, t]
  );

  const handleTagSelect = useCallback((tag: string | null) => {
    const normalizedTag = normalizeTag(tag);
    const nextTag = normalizedTag && normalizedTag === activeTag ? null : normalizedTag;
    const replacesCollection = activeCollection !== 'all';

    setActiveCollection('all');
    setActiveTag(nextTag);

    if (!nextTag && replacesCollection) {
      writeCollectionToLocation('all', 'push');
    } else {
      writeTagToLocation(nextTag, replacesCollection ? 'replace' : 'push');
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeCollection, activeTag]);

  const handleCollectionSelect = useCallback((collectionId: AmbientCollectionId) => {
    const replacesTag = Boolean(activeTag);
    setActiveCollection(collectionId);
    setActiveTag(null);
    writeCollectionToLocation(collectionId, replacesTag ? 'replace' : 'push');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTag]);

  const handleMobileCategorySelect = useCallback((categoryId: string) => {
    const sparseHome = bookmarks.length > 0 && bookmarks.length <= AMBIENT_SPARSE_BOOKMARK_LIMIT;
    if (sparseHome) {
      handleCollectionSelect(categoryId === 'pinned' ? 'pinned' : categoryId);
      return;
    }

    setActiveTag(null);
    setActiveCollection('all');
    writeCollectionToLocation('all', 'replace');

    window.setTimeout(() => {
      const section = categoryId === 'pinned'
        ? document.querySelector("[data-section='pinned']")
        : document.querySelector(`[data-category-id="${categoryId}"]`);

      if (section) {
        const top = section.getBoundingClientRect().top + window.scrollY - 88;
        window.scrollTo({ top, behavior: 'smooth' });
        return;
      }

      handleCollectionSelect(categoryId === 'pinned' ? 'pinned' : categoryId);
      setCurrentPage('library');
    }, 0);
  }, [bookmarks.length, handleCollectionSelect, setCurrentPage]);

  // ========== 数据分组（useMemo 优化，避免每次渲染重新计算） ==========
  const tagStats = useMemo(() => buildTagStats(bookmarks), [bookmarks]);
  const visibleBookmarks = useMemo(
    () => filterBookmarksByTag(bookmarks, activeTag),
    [bookmarks, activeTag]
  );
  const pinnedBookmarks = useMemo(() => visibleBookmarks.filter((b) => b.isPinned), [visibleBookmarks]);
  const allPinnedCount = useMemo(() => bookmarks.filter((b) => b.isPinned).length, [bookmarks]);
  const allReadLaterCount = useMemo(
    () => bookmarks.filter((bookmark) => bookmark.isReadLater && !bookmark.isRead).length,
    [bookmarks],
  );
  const isSparseHome = bookmarks.length > 0 && bookmarks.length <= AMBIENT_SPARSE_BOOKMARK_LIMIT;
  const isLibraryPage = currentPage === "library";
  const collectionFilterEnabled = isSparseHome || isLibraryPage;

  const bookmarksByCategory = useMemo(() => categories.reduce((acc, cat) => {
    const categoryBookmarks = visibleBookmarks.filter((b) => b.category === cat.id);
    acc[cat.id] = categoryBookmarks.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return a.orderIndex - b.orderIndex;
    });
    return acc;
  }, {} as Record<string, Bookmark[]>), [visibleBookmarks, categories]);

  const homeCategorySections = useMemo(
    () => categories
      .filter((category) => (bookmarksByCategory[category.id] || []).length > 0)
      .slice(0, 4),
    [bookmarksByCategory, categories],
  );
  const visibleHomeCategoryCount = useMemo(
    () => categories.filter((category) => (bookmarksByCategory[category.id] || []).length > 0).length,
    [bookmarksByCategory, categories],
  );

  const mobileCategoryItems = useMemo(() => categories
    .map((category) => ({
      ...category,
      count: bookmarks.filter((bookmark) => bookmark.category === category.id).length,
    }))
    .filter((category) => category.count > 0), [bookmarks, categories]);

  // 数据量增长、分类删除或筛选集合失效时，回到“全部”这一稳定状态。
  useEffect(() => {
    const resetCollection = () => {
      setActiveCollection('all');
      writeCollectionToLocation('all', 'replace');
    };

    if (!collectionFilterEnabled) {
      if (activeCollection !== 'all') resetCollection();
      return;
    }

    if (activeCollection === 'pinned' && allPinnedCount === 0) {
      resetCollection();
      return;
    }

    if (activeCollection === 'read-later' && allReadLaterCount === 0) {
      resetCollection();
      return;
    }

    if (
      activeCollection !== 'all' &&
      activeCollection !== 'pinned' &&
      activeCollection !== 'read-later' &&
      !categories.some((category) => category.id === activeCollection)
    ) {
      resetCollection();
    }
  }, [activeCollection, allPinnedCount, allReadLaterCount, categories, collectionFilterEnabled]);

  // ========== 页面路由 ==========
  if (currentPage === "admin-login") {
    return (
      <AdminLogin
        onLogin={handleAdminLogin}
        onBack={() => setCurrentPage("home")}
        isDark={isDark}
      />
    );
  }

  if (currentPage === "force-password-change") {
    if (!isLoggedIn) {
      setCurrentPage("admin-login");
      return null;
    }
    return (
      <ForcePasswordChange
        username={adminUsername}
        onSuccess={handlePasswordChangeSuccess}
        onLogout={handleAdminLogout}
      />
    );
  }

  if (currentPage === "admin") {
    if (!isLoggedIn) {
      navigateToLogin('admin');
      return null;
    }
    return (
      <>
        <Admin
          bookmarks={bookmarks}
          categories={categories}
          customIcons={customIcons}
          username={adminUsername}
          activeTab={adminTab}
          onTabChange={setAdminTab}
          onBack={() => setCurrentPage("home")}
          onLogout={handleAdminLogout}
          onAddBookmark={() => setIsAddModalOpen(true)}
          onEditBookmark={(bookmark) => {
            setEditingBookmark(bookmark);
            setIsAddModalOpen(true);
          }}
          onDeleteBookmark={deleteBookmark}
          onTogglePin={togglePin}
          onToggleReadLater={toggleReadLater}
          onUpdateBookmark={updateBookmark}
          onAddCategory={addCategory}
          onUpdateCategory={updateCategory}
          onDeleteCategory={deleteCategory}
          onReorderCategories={reorderCategories}
          onAddCustomIcon={addCustomIcon}
          onDeleteCustomIcon={deleteCustomIcon}
          onRefreshData={refreshData}
          onQuotesUpdate={handleQuotesChange}
          onSettingsChange={setSiteSettings}
        />
        <AddBookmarkModal
          isOpen={isAddModalOpen}
          onClose={() => {
            setIsAddModalOpen(false);
            setEditingBookmark(null);
            setPendingUrl("");
          }}
          onAdd={handleSaveBookmark}
          categories={categories}
          customIcons={customIcons}
          initialUrl={pendingUrl}
          editBookmark={editingBookmark}
          onOpenIconManager={() => setIsIconManagerOpen(true)}
          onCategoryAdded={(newCategory) => appendCategory(newCategory)}
          enableAutoAi={enableAutoAi}
          defaultVisibility={defaultBookmarkVisibility}
        />
        <IconManager
          isOpen={isIconManagerOpen}
          onClose={() => setIsIconManagerOpen(false)}
          customIcons={customIcons}
          onAddIcon={addCustomIcon}
          onDeleteIcon={deleteCustomIcon}
        />
      </>
    );
  }

  // ========== 私人模式：未登录时显示登录引导 ==========
  if (accessMode === 'private' && !isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--color-bg-primary, #0a0a0f)' }}>
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full blur-3xl" style={{ background: 'rgba(102, 126, 234, 0.08)' }} />
          <div className="absolute bottom-1/3 right-1/4 w-96 h-96 rounded-full blur-3xl" style={{ background: 'rgba(236, 72, 153, 0.08)' }} />
        </div>

        <motion.div
          className="relative w-full max-w-md text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div
            className="relative p-8 rounded-3xl backdrop-blur-xl overflow-hidden"
            style={{
              background: 'var(--color-glass, rgba(255,255,255,0.03))',
              border: '1px solid var(--color-glass-border, rgba(255,255,255,0.08))',
            }}
          >
            <motion.div
              className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.2), rgba(236, 72, 153, 0.2))' }}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
            >
              <Pin className="w-10 h-10" style={{ color: 'var(--color-primary, #667eea)' }} />
            </motion.div>

            <motion.h1
              className="text-2xl font-bold mb-2"
              style={{ color: 'var(--color-text-primary, #fff)' }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {siteSettings.siteTitle || 'NOWEN'}
            </motion.h1>

            <motion.p
              className="text-sm mb-8"
              style={{ color: 'var(--color-text-muted, rgba(255,255,255,0.4))' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {t('access.private_hint')}
            </motion.p>

            <motion.button
              onClick={() => navigateToLogin(currentPage === 'library' ? 'library' : 'home')}
              className="w-full py-3.5 rounded-xl text-white font-medium relative overflow-hidden group"
              style={{ background: 'linear-gradient(135deg, #667eea, #ec4899)' }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {t('access.go_login')}
              </span>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'linear-gradient(135deg, #ec4899, #667eea)' }} />
            </motion.button>

            <motion.div
              className="mt-6 flex items-center justify-center gap-2 text-xs"
              style={{ color: 'var(--color-text-muted, rgba(255,255,255,0.3))' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <div className="w-2 h-2 rounded-full bg-amber-500/60" />
              {t('access.private_mode')}
            </motion.div>
          </div>
        </motion.div>
      </div>
    );
  }

  // ========== 壁纸设置 ==========
  const wallpaper = siteSettings.wallpaper;
  const wallpaperEnabled = wallpaper?.enabled === true;
  const wallpaperImageSrc = wallpaperEnabled
    ? wallpaper?.source === 'upload'
      ? wallpaper?.imageData
      : wallpaper?.imageUrl
    : undefined;

  // ========== 首页渲染 ==========
  const BackgroundWrapper = isLiteMode ? LiteBackground : AuroraBackground;
  const backgroundProps = isLiteMode
    ? {}
    : { showBeams: siteSettings.enableBeamAnimation !== false };

  const renderPrimaryWidgets = (standalone: boolean) => (
    <motion.section
      className="mb-12"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.65 }}
    >
      {hasPrimaryWidgets && (
        <div className="flex items-center justify-end mb-4">
          <WidgetSizeModeToggle widgetSizeMode={widgetSizeMode} onChange={handleWidgetSizeModeChange} />
        </div>
      )}
      <BentoGrid>
        {effectiveWidgetVisibility.systemMonitor !== false && (
          <BentoGridItem key={`system-monitor-${standalone ? 'standalone' : 'pinned'}`} colSpan={2} rowSpan={widgetSizeMode === 'S' ? 1 : 2} spotlightColor={isLiteMode ? undefined : "rgba(6, 182, 212, 0.15)"} delay={0}>
            <SystemMonitorCard forceCollapsed={widgetSizeMode === 'S' ? true : widgetSizeMode === 'L' ? false : undefined} />
          </BentoGridItem>
        )}
        {effectiveWidgetVisibility.hardwareIdentity !== false && (
          <BentoGridItem key={`hardware-specs-${standalone ? 'standalone' : 'pinned'}`} colSpan={2} rowSpan={widgetSizeMode === 'S' ? 1 : 2} spotlightColor={isLiteMode ? undefined : "rgba(6, 182, 212, 0.1)"} delay={0.1}>
            <HardwareIdentityCard forceCollapsed={widgetSizeMode === 'S' ? true : widgetSizeMode === 'L' ? false : undefined} />
          </BentoGridItem>
        )}
        {effectiveWidgetVisibility.vitalSigns !== false && (
          <BentoGridItem key={`vital-signs-${standalone ? 'standalone' : 'pinned'}`} colSpan={2} rowSpan={widgetSizeMode === 'S' ? 1 : 2} spotlightColor={isLiteMode ? undefined : "rgba(6, 182, 212, 0.12)"} delay={0.15}>
            <VitalSignsCard forceCollapsed={widgetSizeMode === 'S' ? true : widgetSizeMode === 'L' ? false : undefined} />
          </BentoGridItem>
        )}
        {effectiveWidgetVisibility.networkTelemetry !== false && (
          <BentoGridItem key={`network-telemetry-${standalone ? 'standalone' : 'pinned'}`} colSpan={2} rowSpan={widgetSizeMode === 'S' ? 1 : 2} spotlightColor={isLiteMode ? undefined : "rgba(168, 85, 247, 0.12)"} delay={0.2}>
            <NetworkTelemetryCard forceCollapsed={widgetSizeMode === 'S' ? true : widgetSizeMode === 'L' ? false : undefined} />
          </BentoGridItem>
        )}
        {effectiveWidgetVisibility.processMatrix !== false && (
          <BentoGridItem key={`process-matrix-${standalone ? 'standalone' : 'pinned'}`} colSpan={2} rowSpan={widgetSizeMode === 'S' ? 1 : 2} spotlightColor={isLiteMode ? undefined : "rgba(34, 197, 94, 0.12)"} delay={0.25}>
            <ProcessMatrixCard forceCollapsed={widgetSizeMode === 'S' ? true : widgetSizeMode === 'L' ? false : undefined} />
          </BentoGridItem>
        )}
      </BentoGrid>
    </motion.section>
  );

  return (
    <QuickNotesProvider
      syncMode={nowenNote?.syncMode || 'auto'}
      remoteConfigured={!!nowenNote?.hasToken && !!nowenNote?.baseUrl}
    >
    <CloudDrawerProvider>
    <>
      {wallpaperEnabled && wallpaperImageSrc && (
        <>
          <div
            className="fixed bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url(${wallpaperImageSrc})`,
              filter: `blur(${wallpaper?.blur || 0}px)`,
              inset: '-5%',
              zIndex: 0,
              willChange: 'auto',
            }}
          />
          {(wallpaper?.overlay ?? 30) > 0 && (
            <div
              className="fixed inset-0"
              style={{
                backgroundColor: `rgba(0, 0, 0, ${(wallpaper?.overlay ?? 30) / 100})`,
                zIndex: 0,
              }}
            />
          )}
        </>
      )}

    <BackgroundWrapper
      {...backgroundProps}
      {...(wallpaperEnabled && wallpaperImageSrc ? { transparent: true } : {})}
    >
      {!isLiteMode && <Meteors number={4} />}

      {enableSidebarNav && currentPage === "home" && !isSparseHome && (
        <SidebarNav
          items={homeCategorySections.map((cat) => ({
              id: cat.id,
              name: cat.name,
              icon: cat.icon,
              color: cat.color,
              count: (bookmarksByCategory[cat.id] || []).length,
            }))}
          pinnedCount={pinnedBookmarks.length}
        />
      )}

      <div className="min-h-screen px-4 sm:px-6 lg:px-8 pb-32">
        <div className={isLibraryPage ? "max-w-[1800px] mx-auto" : "max-w-6xl mx-auto"}>
          {isLibraryPage ? (
            <React.Suspense
              fallback={(
                <div
                  className="mx-auto mt-6 min-h-[36rem] max-w-[1800px] animate-pulse rounded-[2rem]"
                  style={{
                    background: 'var(--color-glass)',
                    border: '1px solid var(--color-glass-border)',
                  }}
                  aria-label={t('library.loading', '正在加载书签库')}
                />
              )}
            >
              <BookmarkLibrary
                bookmarks={bookmarks}
                categories={categories}
                activeTag={activeTag}
                activeCollection={activeCollection}
                isInternal={isInternal}
                isLoggedIn={isLoggedIn}
                onBack={() => setCurrentPage("home")}
                onOpenSearch={() => setIsSpotlightOpen(true)}
                onAddBookmark={() => setIsAddModalOpen(true)}
                onSelectTag={handleTagSelect}
                onSelectCollection={handleCollectionSelect}
                onContextMenu={handleContextMenu}
              />
            </React.Suspense>
          ) : (
            <>
          <HeroSection
            formattedTime={formattedTime}
            formattedDate={formattedDate}
            lunarDate={lunarDate}
            greeting={greeting}
            isLiteMode={isLiteMode}
            showWeather={showWeather}
            showLunar={showLunar}
            showSearch={showSearch}
            weather={weather}
            weatherLoading={weatherLoading}
            weatherCity={weatherCity}
            hasWallpaper={wallpaperEnabled && !!wallpaperImageSrc}
            onRefreshWeather={refreshWeather}
            onCityChange={handleWeatherCityChange}
            onOpenSearch={() => setIsSpotlightOpen(true)}
          />

          {activeTag && (
            <motion.div
              className="mb-6 flex flex-wrap items-center gap-2 rounded-2xl px-4 py-3 backdrop-blur-xl"
              style={{ background: 'var(--color-glass)', border: '1px solid var(--color-glass-border)' }}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                {t('mobileNavigation.activeFilter', '当前筛选')}
              </span>
              <button
                type="button"
                onClick={() => handleTagSelect(null)}
                className="rounded-lg px-2.5 py-1 text-sm font-medium"
                style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)', border: '1px solid var(--color-primary)' }}
              >
                #{activeTag}
              </button>
              <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                {visibleBookmarks.length} {t('mobileNavigation.results', '个结果')}
              </span>
              <button
                type="button"
                aria-label={t('mobileNavigation.clear', '清除标签筛选')}
                onClick={() => handleTagSelect(null)}
                className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg text-lg"
                style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-muted)' }}
              >
                ×
              </button>
            </motion.div>
          )}

          {!isSparseHome && bookmarks.length > 0 && (
            <motion.section
              className="ambient-library-gateway"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.42, duration: 0.45 }}
            >
              <span className="ambient-library-gateway__icon" aria-hidden="true">
                <LibraryBig className="h-5 w-5" />
              </span>
              <div className="ambient-library-gateway__copy">
                <strong>{t('library.title', '书签库')}</strong>
                <span>
                  {bookmarks.length} {t('bookmark.items', '个书签')} · {visibleHomeCategoryCount} {t('bookmark.categories', '个分类')}
                </span>
              </div>
              <button type="button" onClick={() => setCurrentPage('library')}>
                {t('library.open', '浏览全部')}
                <ArrowRight className="h-4 w-4" />
              </button>
            </motion.section>
          )}

          {!isSparseHome && (
            <ReadLaterSection
              bookmarks={visibleBookmarks}
              isLiteMode={isLiteMode ?? false}
              onMarkRead={toggleRead}
              onRemove={toggleReadLater}
            />
          )}

          {!isSparseHome && pinnedBookmarks.length > 0 ? (
            <motion.section
              className="mb-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              data-section="pinned"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="relative">
                  <Pin className="w-5 h-5 text-yellow-400" />
                  <BreathingDot color="#eab308" size="sm" className="absolute -top-1 -right-1" />
                </div>
                <h2 className="text-xl font-medium tracking-wide" style={{ color: "var(--color-text-primary)" }}>
                  常用
                </h2>
                <span className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                  {pinnedBookmarks.length}
                </span>
                {hasPrimaryWidgets && (
                  <div className="ml-auto">
                    <WidgetSizeModeToggle widgetSizeMode={widgetSizeMode} onChange={handleWidgetSizeModeChange} />
                  </div>
                )}
              </div>

              <BentoGrid>
                {effectiveWidgetVisibility.systemMonitor !== false && (
                  <BentoGridItem key="system-monitor" colSpan={2} rowSpan={widgetSizeMode === 'S' ? 1 : 2} spotlightColor={isLiteMode ? undefined : "rgba(6, 182, 212, 0.15)"} delay={0}>
                    <SystemMonitorCard forceCollapsed={widgetSizeMode === 'S' ? true : widgetSizeMode === 'L' ? false : undefined} />
                  </BentoGridItem>
                )}
                {effectiveWidgetVisibility.hardwareIdentity !== false && (
                  <BentoGridItem key="hardware-specs" colSpan={2} rowSpan={widgetSizeMode === 'S' ? 1 : 2} spotlightColor={isLiteMode ? undefined : "rgba(6, 182, 212, 0.1)"} delay={0.1}>
                    <HardwareIdentityCard forceCollapsed={widgetSizeMode === 'S' ? true : widgetSizeMode === 'L' ? false : undefined} />
                  </BentoGridItem>
                )}
                {effectiveWidgetVisibility.vitalSigns !== false && (
                  <BentoGridItem key="vital-signs" colSpan={2} rowSpan={widgetSizeMode === 'S' ? 1 : 2} spotlightColor={isLiteMode ? undefined : "rgba(6, 182, 212, 0.12)"} delay={0.15}>
                    <VitalSignsCard forceCollapsed={widgetSizeMode === 'S' ? true : widgetSizeMode === 'L' ? false : undefined} />
                  </BentoGridItem>
                )}
                {effectiveWidgetVisibility.networkTelemetry !== false && (
                  <BentoGridItem key="network-telemetry" colSpan={2} rowSpan={widgetSizeMode === 'S' ? 1 : 2} spotlightColor={isLiteMode ? undefined : "rgba(168, 85, 247, 0.12)"} delay={0.2}>
                    <NetworkTelemetryCard forceCollapsed={widgetSizeMode === 'S' ? true : widgetSizeMode === 'L' ? false : undefined} />
                  </BentoGridItem>
                )}
                {effectiveWidgetVisibility.processMatrix !== false && (
                  <BentoGridItem key="process-matrix" colSpan={2} rowSpan={widgetSizeMode === 'S' ? 1 : 2} spotlightColor={isLiteMode ? undefined : "rgba(34, 197, 94, 0.12)"} delay={0.25}>
                    <ProcessMatrixCard forceCollapsed={widgetSizeMode === 'S' ? true : widgetSizeMode === 'L' ? false : undefined} />
                  </BentoGridItem>
                )}

                {pinnedBookmarks.map((bookmark, index) => (
                  <BentoGridItem
                    key={bookmark.id}
                    colSpan={1}
                    rowSpan={1}
                    spotlightColor={isLiteMode ? undefined : "rgba(234, 179, 8, 0.15)"}
                    onClick={() => { visitsApi.track(bookmark.id).catch(console.error); window.open(getBookmarkUrl(bookmark, isInternal), "_blank") }}
                    onContextMenu={(e) => handleContextMenu(e, bookmark)}
                    delay={(index + 2) * 0.05}
                  >
                    <BookmarkCardContent
                      bookmark={bookmark}
                      isLarge={false}
                      isNew={bookmark.id === newlyAddedId}
                      isLoggedIn={isLoggedIn}
                      onTogglePin={() => togglePin(bookmark.id)}
                      onToggleReadLater={() => toggleReadLater(bookmark.id)}
                      onEdit={() => {
                        setEditingBookmark(bookmark);
                        setIsAddModalOpen(true);
                      }}
                      onDelete={() => handleDelete(bookmark.id)}
                      onTagSelect={handleTagSelect}
                    />
                  </BentoGridItem>
                ))}
              </BentoGrid>
            </motion.section>
          ) : hasPrimaryWidgets ? (
            renderPrimaryWidgets(true)
          ) : null}

          {isSparseHome && visibleBookmarks.length > 0 ? (
            <AmbientBookmarkStage
              bookmarks={visibleBookmarks}
              categories={categories}
              activeCollection={activeCollection}
              cardViewMode={cardViewMode}
              isInternal={isInternal}
              isLiteMode={isLiteMode}
              activeTag={activeTag}
              onSelectCollection={handleCollectionSelect}
              onContextMenu={handleContextMenu}
              onTagSelect={(tag) => handleTagSelect(tag)}
            />
          ) : !isSparseHome ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragCancel={handleDragCancel}
              measuring={measuringConfig}
            >
              {homeCategorySections.map((category, catIndex) => {
                const categoryBookmarks = bookmarksByCategory[category.id] || [];
                if (categoryBookmarks.length === 0) return null;

                return (
                  <CategorySection
                    key={category.id}
                    category={category}
                    categoryBookmarks={categoryBookmarks}
                    catIndex={catIndex}
                    isLiteMode={isLiteMode}
                    isInternal={isInternal}
                    totalBookmarkCount={visibleBookmarks.length}
                    collapseThreshold={categoryCollapseThreshold}
                    initialShowCount={categoryInitialShowCount}
                    cardViewMode={cardViewMode}
                    onContextMenu={handleContextMenu}
                    onEditCategory={(cat) => {
                      setEditingCategory(cat);
                      setCategoryModalMode('edit');
                      setIsCategoryModalOpen(true);
                    }}
                    onViewModeChange={handleCardViewModeChange}
                    onTagSelect={handleTagSelect}
                    isLoggedIn={isLoggedIn}
                  />
                );
              })}

              <BookmarkDragOverlay activeBookmark={activeBookmark} cardViewMode={cardViewMode} />
            </DndContext>
          ) : null}

          {activeTag && visibleBookmarks.length === 0 && !isLoading && (
            <motion.div
              className="mb-12 flex flex-col items-center justify-center rounded-3xl px-6 py-14 text-center"
              style={{ background: 'var(--color-glass)', border: '1px solid var(--color-glass-border)' }}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <p className="text-lg font-medium" style={{ color: 'var(--color-text-primary)' }}>
                {t('mobileNavigation.noResults', '没有找到包含该标签的书签')}
              </p>
              <p className="mt-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>#{activeTag}</p>
              <button
                type="button"
                onClick={() => handleTagSelect(null)}
                className="mt-5 rounded-xl px-4 py-2 text-sm font-medium"
                style={{ background: 'var(--color-primary)', color: '#fff' }}
              >
                {t('mobileNavigation.clear', '清除标签筛选')}
              </button>
            </motion.div>
          )}
          {!activeTag && bookmarks.length === 0 && !isLoading && (
            <EmptyState isLiteMode={isLiteMode ?? false} isLoggedIn={isLoggedIn} onAddBookmark={() => setIsAddModalOpen(true)} />
          )}
            </>
          )}
        </div>
      </div>

      {!isLibraryPage && siteSettings.footerText && (
        <div className="w-full text-center pb-20 md:pb-24 pt-8 px-4">
          <p
            className="text-xs leading-relaxed"
            style={{ color: 'var(--color-text-muted)' }}
            dangerouslySetInnerHTML={{ __html: siteSettings.footerText }}
          />
        </div>
      )}

      {showSearch && (
        <SpotlightSearch
          isOpen={isSpotlightOpen}
          onClose={() => setIsSpotlightOpen(false)}
          bookmarks={bookmarks}
          onAddBookmark={handleAddFromSpotlight}
          searchEngineSettings={searchEngine}
        />
      )}

      {isLoggedIn && effectiveWidgetVisibility.aiAssistant !== false && (
        <AiAssistant
          isOpen={isAiAssistantOpen}
          onClose={() => setIsAiAssistantOpen(false)}
        />
      )}

      <AddBookmarkModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingBookmark(null);
          setPendingUrl("");
        }}
        onAdd={handleSaveBookmark}
        categories={categories}
        customIcons={customIcons}
        initialUrl={pendingUrl}
        editBookmark={editingBookmark}
        onOpenIconManager={() => setIsIconManagerOpen(true)}
        onCategoryAdded={(newCategory) => appendCategory(newCategory)}
        enableAutoAi={enableAutoAi}
        defaultVisibility={defaultBookmarkVisibility}
      />

      <IconManager
        isOpen={isIconManagerOpen}
        onClose={() => setIsIconManagerOpen(false)}
        customIcons={customIcons}
        onAddIcon={addCustomIcon}
        onDeleteIcon={deleteCustomIcon}
      />

      <CategoryEditModal
        isOpen={isCategoryModalOpen}
        category={editingCategory}
        mode={categoryModalMode}
        onClose={() => {
          setIsCategoryModalOpen(false);
          setEditingCategory(null);
        }}
        onSave={(id, updates) => updateCategory(id, updates)}
        onDelete={(id) => deleteCategory(id)}
        onAdd={(category) => addCategory(category)}
      />

      {contextMenu.bookmark && (
        <ContextMenu
          isOpen={contextMenu.isOpen}
          position={contextMenu.position}
          onClose={closeContextMenu}
          items={getMenuItems(contextMenu.bookmark, {
            onEdit: () => {
              setEditingBookmark(contextMenu.bookmark);
              setIsAddModalOpen(true);
            },
            onDelete: () => handleDelete(contextMenu.bookmark!.id),
            onTogglePin: () => togglePin(contextMenu.bookmark!.id),
            onToggleReadLater: () => toggleReadLater(contextMenu.bookmark!.id),
            ...(isLoggedIn ? {
              onToggleVisibility: async () => {
                const bk = contextMenu.bookmark!;
                const newVisibility = bk.visibility === 'private' ? 'public' : 'private';
                await updateBookmark(bk.id, { visibility: newVisibility });
                refreshData();
              },
            } : {}),
          })}
        />
      )}

      <ScrollToTop threshold={400} />
    </BackgroundWrapper>

    {enableSidebarNav && currentPage === "home" && (
      <MobileContentNavigation
        categories={mobileCategoryItems}
        tags={tagStats}
        pinnedCount={allPinnedCount}
        totalBookmarks={bookmarks.length}
        activeTag={activeTag}
        activeCollection={activeCollection}
        readLaterCount={allReadLaterCount}
        collectionFilterMode={isSparseHome}
        matchedCount={visibleBookmarks.length}
        onSelectTag={handleTagSelect}
        onSelectCategory={handleMobileCategorySelect}
      />
    )}

    <div className="hidden md:block">
      <FloatingDock
        items={filteredDockItems.map((item) => ({
          ...item,
          onClick: item.href ? undefined : (item.onClick || (() => handleDockClick(item.id))),
        }))}
      />
    </div>

    {currentPage === "home" && effectiveWidgetVisibility.dockMiniMonitor !== false && (
      <div className="hidden md:flex fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
        <SystemMonitor initialMode="mini" size="sm" showLoading={false} />
      </div>
    )}

    <div className="md:hidden">
      <MobileFloatingDock
        items={filteredDockItems
          .filter((item) => currentPage === "home" ? item.id !== "home" : true)
          .map((item) => ({
            id: item.id,
            label: item.title,
            icon: item.IconComponent,
            onClick: item.onClick || (() => handleDockClick(item.id)),
            isActive: item.isActive,
            subItems: item.subItems?.map((sub) => ({
              id: sub.id,
              label: sub.title,
              icon: sub.IconComponent,
              onClick: sub.onClick,
              isActive: sub.isActive,
            })),
          }))}
        leftSlot={
          effectiveWidgetVisibility.mobileTicker !== false
            ? <SystemMonitor initialMode="inline" compact showLoading={false} />
            : undefined
        }
      />
    </div>

    <CloudDrawerHost
      remoteConfigured={!!nowenNote?.hasToken && !!nowenNote?.baseUrl}
      remoteBaseUrl={nowenNote?.baseUrl || undefined}
      syncMode={nowenNote?.syncMode || 'auto'}
      onOpenSettings={() => { setAdminTab('settings'); navigateToAdmin(); }}
    />

    {enableQuickNotes && (
      <QuickNotesDrawer
        open={isQuickNotesDrawerOpen}
        onClose={() => setIsQuickNotesDrawerOpen(false)}
        isLoggedIn={isLoggedIn}
        remoteConfigured={!!nowenNote?.hasToken && !!nowenNote?.baseUrl}
        remoteBaseUrl={nowenNote?.baseUrl || undefined}
        syncMode={nowenNote?.syncMode || 'auto'}
        onOpenSettings={() => { setAdminTab('settings'); navigateToAdmin(); }}
      />
    )}
    </>
    </CloudDrawerProvider>
    </QuickNotesProvider>
  );
}

// ========== 分类区书签卡片（React.memo 优化） ==========
const MAX_ANIMATED_INDEX = 12;

const MemoizedBookmarkItem = React.memo(function MemoizedBookmarkItem({
  bookmark,
  index,
  category,
  isLiteMode,
  isInternal,
  lightweight,
  cardViewMode = 'standard',
  onContextMenu,
  onTagSelect,
}: {
  bookmark: Bookmark;
  index: number;
  category: import("./types/bookmark").Category;
  isLiteMode: boolean | undefined;
  isInternal: boolean;
  lightweight: boolean;
  cardViewMode?: 'compact' | 'standard' | 'comfortable';
  onContextMenu: (e: React.MouseEvent, bookmark: Bookmark) => void;
  onTagSelect: (tag: string) => void;
}) {
  const animDelay = index < MAX_ANIMATED_INDEX ? index * 0.04 : 0;
  const isCompact = cardViewMode === 'compact';

  const card = (
    <SpotlightCard
      className="h-full cursor-pointer"
      size={isCompact ? 'sm' : 'md'}
      spotlightColor={isLiteMode ? "transparent" : `${category.color}20`}
      lightweight={lightweight}
      onClick={() => { visitsApi.track(bookmark.id).catch(console.error); window.open(getBookmarkUrl(bookmark, isInternal), "_blank") }}
      onContextMenu={(e) => onContextMenu(e, bookmark)}
    >
      <div className={`relative flex ${isCompact ? 'flex-row items-center gap-3' : 'flex-col'} h-full`}>
        {bookmark.visibility === 'private' && (
          <div
            className="absolute top-0 right-0 z-10 transition-transform duration-200 hover:scale-110"
            title="私人书签"
          >
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center"
              style={{
                background: 'var(--private-badge-bg, rgba(245, 158, 11, 0.15))',
                border: '1px solid var(--private-badge-border, rgba(245, 158, 11, 0.3))',
              }}
            >
              <Lock className="w-2.5 h-2.5" style={{ color: 'var(--private-badge-icon, rgb(217, 119, 6))' }} />
            </div>
          </div>
        )}
        <div
          className={`${isCompact ? 'w-8 h-8' : 'w-10 h-10'} rounded-xl flex items-center justify-center ${isCompact ? '' : 'mb-4'} flex-shrink-0`}
          style={{ background: "var(--color-bg-tertiary)" }}
        >
          {bookmark.iconUrl ? (
            <img src={bookmark.iconUrl} alt="" className={`${isCompact ? 'w-4 h-4' : 'w-5 h-5'} object-contain`} loading="lazy" onError={(e) => {
              const img = e.target as HTMLImageElement;
              if (bookmark.favicon) {
                img.src = bookmark.favicon;
                img.onerror = () => { img.style.display = 'none'; };
              } else {
                img.style.display = 'none';
              }
            }} />
          ) : bookmark.icon ? (
            <IconRenderer icon={bookmark.icon} className={isCompact ? 'w-4 h-4' : 'w-5 h-5'} style={{ color: "var(--color-primary)" }} />
          ) : bookmark.favicon ? (
            <img src={bookmark.favicon} alt="" className={`${isCompact ? 'w-4 h-4' : 'w-5 h-5'}`} loading="lazy" onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }} />
          ) : (
            <ExternalLink className={isCompact ? 'w-4 h-4' : 'w-5 h-5'} style={{ color: "var(--color-text-muted)" }} />
          )}
        </div>
        <div className={`${isCompact ? 'flex-1 min-w-0' : ''}`}>
          <h3 className={`font-medium line-clamp-1 ${isCompact ? 'text-sm' : 'mb-1'}`} style={{ color: "var(--color-text-primary)" }}>
            {bookmark.title}
          </h3>
          {!isCompact && (
            <p className="text-sm line-clamp-2 flex-1" style={{ color: "var(--color-text-muted)" }}>
              {bookmark.description || (() => { try { return new URL(bookmark.url).hostname } catch { return bookmark.url } })()}
            </p>
          )}
          {isCompact && (
            <p className="text-xs line-clamp-1" style={{ color: "var(--color-text-muted)" }}>
              {bookmark.description || (() => { try { return new URL(bookmark.url).hostname } catch { return bookmark.url } })()}
            </p>
          )}
        </div>
        {!isCompact && bookmark.tags && bookmark.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {bookmark.tags.slice(0, 3).map(tag => {
              const color = getTagColor(tag)
              return (
                <button
                  key={tag}
                  type="button"
                  className="px-1.5 py-0.5 rounded-md text-[10px] leading-tight font-medium truncate max-w-[80px] transition-transform hover:scale-105 active:scale-95"
                  style={{
                    background: color.bg,
                    color: color.text,
                    border: `1px solid ${color.border}`,
                  }}
                  title={tag}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    onTagSelect(tag);
                  }}
                >
                  #{tag}
                </button>
              )
            })}
            {bookmark.tags.length > 3 && (
              <span
                className="px-1.5 py-0.5 rounded-md text-[10px] leading-tight font-medium"
                style={{
                  color: 'var(--color-text-muted)',
                  background: 'var(--color-bg-tertiary)',
                }}
              >
                +{bookmark.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </SpotlightCard>
  );

  if (lightweight) {
    return (
      <SortableCard id={bookmark.id}>
        <div className="h-full">{card}</div>
      </SortableCard>
    );
  }

  return (
    <SortableCard id={bookmark.id}>
      <motion.div
        className="h-full"
        initial={{ opacity: 0, y: isLiteMode ? 5 : 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: animDelay, duration: 0.25 }}
      >
        {card}
      </motion.div>
    </SortableCard>
  );
});

// ========== 视图模式配置 ==========
const VIEW_MODE_CONFIG = {
  compact: {
    gridClass: 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3',
    skeletonHeight: '64px',
  },
  standard: {
    gridClass: 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4',
    skeletonHeight: '120px',
  },
  comfortable: {
    gridClass: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5',
    skeletonHeight: '140px',
  },
} as const;

function CategorySkeleton({ count, color, cardViewMode = 'standard' }: { count: number; color: string; cardViewMode?: 'compact' | 'standard' | 'comfortable' }) {
  const displayCount = Math.min(count, 8);
  const config = VIEW_MODE_CONFIG[cardViewMode];
  const isCompact = cardViewMode === 'compact';
  return (
    <div className={`${config.gridClass} relative z-10`}>
      {Array.from({ length: displayCount }).map((_, i) => (
        <div
          key={i}
          className={`rounded-2xl ${isCompact ? 'p-3' : 'p-5'} animate-pulse`}
          style={{
            background: 'var(--color-glass)',
            border: '1px solid var(--color-glass-border)',
            minHeight: config.skeletonHeight,
          }}
        >
          <div className={`${isCompact ? 'w-8 h-8 mb-2' : 'w-10 h-10 mb-4'} rounded-xl`} style={{ background: `${color}15` }} />
          <div className={`${isCompact ? 'h-3' : 'h-4'} rounded-md mb-2 w-3/4`} style={{ background: 'var(--color-bg-tertiary)' }} />
          {!isCompact && <div className="h-3 rounded-md w-1/2" style={{ background: 'var(--color-bg-tertiary)' }} />}
        </div>
      ))}
    </div>
  );
}

const VIEW_MODES = [
  { key: 'compact' as const, icon: Grid3X3, titleKey: 'bookmark.view_compact' },
  { key: 'standard' as const, icon: LayoutGrid, titleKey: 'bookmark.view_standard' },
  { key: 'comfortable' as const, icon: StretchHorizontal, titleKey: 'bookmark.view_comfortable' },
];

function ViewModeToggle({
  cardViewMode,
  onChange,
}: {
  cardViewMode: 'compact' | 'standard' | 'comfortable';
  onChange: (mode: 'compact' | 'standard' | 'comfortable') => void;
}) {
  const { t } = useTranslation();
  return (
    <div
      className="flex items-center rounded-lg p-0.5 gap-0.5"
      style={{ background: 'var(--color-bg-tertiary)' }}
    >
      {VIEW_MODES.map(({ key, icon: Icon, titleKey }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`p-1.5 rounded-md transition-all ${
            cardViewMode === key
              ? 'shadow-sm'
              : 'hover:bg-white/5'
          }`}
          style={{
            background: cardViewMode === key ? 'var(--color-glass)' : 'transparent',
            color: cardViewMode === key ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
          }}
          title={t(titleKey, key)}
        >
          <Icon className="w-3.5 h-3.5" />
        </button>
      ))}
    </div>
  );
}

const WIDGET_SIZE_MODES = [
  { key: 'S' as const, icon: Minimize2, titleKey: 'monitor.widget_size_small' },
  { key: 'M' as const, icon: Square, titleKey: 'monitor.widget_size_medium' },
  { key: 'L' as const, icon: Maximize2, titleKey: 'monitor.widget_size_large' },
];

function WidgetSizeModeToggle({
  widgetSizeMode,
  onChange,
}: {
  widgetSizeMode: 'S' | 'M' | 'L';
  onChange: (mode: 'S' | 'M' | 'L') => void;
}) {
  const { t } = useTranslation();
  return (
    <div
      className="flex items-center rounded-lg p-0.5 gap-0.5"
      style={{ background: 'var(--color-bg-tertiary)' }}
    >
      {WIDGET_SIZE_MODES.map(({ key, icon: Icon, titleKey }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`p-1.5 rounded-md transition-all ${
            widgetSizeMode === key
              ? 'shadow-sm'
              : 'hover:bg-white/5'
          }`}
          style={{
            background: widgetSizeMode === key ? 'var(--color-glass)' : 'transparent',
            color: widgetSizeMode === key ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
          }}
          title={t(titleKey, key)}
        >
          <Icon className="w-3.5 h-3.5" />
        </button>
      ))}
    </div>
  );
}

function CategorySection({
  category,
  categoryBookmarks,
  catIndex,
  isLiteMode,
  isInternal,
  totalBookmarkCount,
  collapseThreshold,
  initialShowCount,
  cardViewMode = 'standard',
  onContextMenu,
  onEditCategory,
  onViewModeChange,
  onTagSelect,
  isLoggedIn,
}: {
  category: import("./types/bookmark").Category;
  categoryBookmarks: Bookmark[];
  catIndex: number;
  isLiteMode: boolean | undefined;
  isInternal: boolean;
  totalBookmarkCount: number;
  collapseThreshold: number;
  initialShowCount: number;
  cardViewMode?: 'compact' | 'standard' | 'comfortable';
  onContextMenu: (e: React.MouseEvent, bookmark: Bookmark) => void;
  onEditCategory: (cat: import("./types/bookmark").Category) => void;
  onViewModeChange?: (mode: 'compact' | 'standard' | 'comfortable') => void;
  onTagSelect: (tag: string) => void;
  isLoggedIn?: boolean;
}) {
  const { t } = useTranslation();
  const PAGE_SIZE = 100;
  const baseShowCount = initialShowCount || 8;
  const needsCollapse = collapseThreshold > 0 && categoryBookmarks.length > collapseThreshold;
  const [displayCount, setDisplayCount] = useState(needsCollapse ? baseShowCount : categoryBookmarks.length);

  useEffect(() => {
    if (!needsCollapse) {
      setDisplayCount(categoryBookmarks.length);
    } else {
      setDisplayCount(prev => Math.min(prev, categoryBookmarks.length));
    }
  }, [categoryBookmarks.length, needsCollapse]);

  const isFullyExpanded = displayCount >= categoryBookmarks.length;
  const visibleBookmarks = isFullyExpanded ? categoryBookmarks : categoryBookmarks.slice(0, displayCount);
  const hiddenCount = categoryBookmarks.length - displayCount;

  const [lazyRef, shouldRender] = useLazyRender('300px');
  const isEager = catIndex < 2;
  const doRender = isEager || shouldRender;
  const lightweight = totalBookmarkCount > 50;

  return (
    <motion.section
      ref={isEager ? undefined : lazyRef}
      className="mb-12 relative group"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(1.2 + catIndex * 0.1, 1.8) }}
      data-category-id={category.id}
    >
      {!isLiteMode && (
        <div
          className="absolute -top-8 left-0 text-[120px] font-bold pointer-events-none select-none leading-none"
          style={{ fontFamily: "Inter, sans-serif", color: "var(--color-text-muted)", opacity: 0.03 }}
        >
          {category.name}
        </div>
      )}

      <div className="flex items-center gap-3 mb-6 relative z-10">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center backdrop-blur-sm"
          style={{ backgroundColor: `${category.color}15`, color: category.color }}
        >
          <IconRenderer icon={category.icon} className="w-4 h-4" />
        </div>
        <h2 className="text-xl font-medium tracking-wide" style={{ color: "var(--color-text-primary)" }}>
          {category.name}
        </h2>
        <span className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          {categoryBookmarks.length}
        </span>
        {isLoggedIn && (
          <button
            onClick={() => onEditCategory(category)}
            className="ml-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-white/10 transition-all"
            style={{ color: "var(--color-text-muted)" }}
            title="编辑分类"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        )}
        {onViewModeChange && <span className="sr-only" />}
      </div>

      <SortableContext items={visibleBookmarks.map(b => b.id)} strategy={rectSortingStrategy}>
        <div className={`${VIEW_MODE_CONFIG[cardViewMode].gridClass} relative z-10`}>
          {doRender ? visibleBookmarks.map((bookmark, index) => (
            <MemoizedBookmarkItem
              key={bookmark.id}
              bookmark={bookmark}
              index={index}
              category={category}
              isLiteMode={isLiteMode}
              isInternal={isInternal}
              lightweight={lightweight}
              cardViewMode={cardViewMode}
              onContextMenu={onContextMenu}
              onTagSelect={onTagSelect}
            />
          )) : null}
        </div>
      </SortableContext>

      {!doRender && (
        <CategorySkeleton count={categoryBookmarks.length} color={category.color || '#667eea'} cardViewMode={cardViewMode} />
      )}

      {doRender && needsCollapse && !isFullyExpanded && (
        <div className="flex justify-center mt-4 relative z-10">
          <button
            onClick={() => setDisplayCount(prev => Math.min(prev + PAGE_SIZE, categoryBookmarks.length))}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-105 active:scale-95 backdrop-blur-sm"
            style={{
              background: 'var(--color-glass)',
              border: '1px solid var(--color-glass-border)',
              color: 'var(--color-text-secondary)',
            }}
          >
            <ChevronDown className="w-4 h-4" />
            {t('bookmark.show_more', '展开更多')} ({hiddenCount})
          </button>
        </div>
      )}
      {doRender && needsCollapse && isFullyExpanded && displayCount !== baseShowCount && (
        <div className="flex justify-center mt-4 relative z-10">
          <button
            onClick={() => setDisplayCount(baseShowCount)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-105 active:scale-95 backdrop-blur-sm"
            style={{
              background: 'var(--color-glass)',
              border: '1px solid var(--color-glass-border)',
              color: 'var(--color-text-secondary)',
            }}
          >
            <ChevronUp className="w-4 h-4" />
            {t('bookmark.collapse', '收起')}
          </button>
        </div>
      )}
    </motion.section>
  );
}

export default App;
