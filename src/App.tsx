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
} from "lucide-react";

// API
import { visitsApi, updateSettings } from "./lib/api";

// UI 组件
import { AuroraBackground } from "./components/ui/aurora-background";
import { BentoGrid, BentoGridItem } from "./components/ui/bento-grid";
import { SpotlightCard } from "./components/ui/spotlight-card";
import { FloatingDock } from "./components/ui/floating-dock";
import { MobileFloatingDock } from "./components/ui/mobile-floating-dock";
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
} from "./components/home";

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
  const [isIconManagerOpen, setIsIconManagerOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const [editingCategory, setEditingCategory] = useState<import("./types/bookmark").Category | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryModalMode, setCategoryModalMode] = useState<'edit' | 'add'>('edit');
  const [pendingUrl, setPendingUrl] = useState("");

  // 右键菜单状态
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
    bookmark: Bookmark | null;
  }>({ isOpen: false, position: { x: 0, y: 0 }, bookmark: null });

  // ========== 自定义 Hooks ==========
  const { getMenuItems } = useBookmarkContextMenu();
  const { greeting, formattedTime, formattedDate, lunarDate } = useTime();
  const { isDark, toggleDarkMode } = useThemeContext();
  const { t, i18n } = useTranslation();
  const { isInternal } = useNetworkEnv();

  // 站点设置
  const {
    siteSettings,
    setSiteSettings,
    isLiteMode,
    showWeather,
    showLunar,
    weatherCity,
    enableAutoAi,
    menuVisibility,
    widgetVisibility,
    categoryCollapseThreshold,
    categoryInitialShowCount,
    cardViewMode,
    widgetSizeMode,
  } = useSiteSettings();

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

  // 拖拽功能
  const {
    activeBookmark,
    sensors,
    handleDragStart,
    handleDragEnd,
    handleDragCancel,
    measuringConfig,
  } = useDragAndDrop({ bookmarks, reorderBookmarks, disabled: !isLoggedIn });

  // 天气数据
  const { weather, loading: weatherLoading, refresh: refreshWeather } = useWeather(showWeather, weatherCity);

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
    const nextLang = i18n.language === 'en' ? 'zh' : 'en';
    i18n.changeLanguage(nextLang);
  }, [i18n]);

  const dockItems = createDockItems(isDark, toggleDarkMode, t, toggleLanguage);
  const filteredDockItems = filterDockItems(dockItems, menuVisibility, widgetVisibility, isLoggedIn);

  // ========== 全局快捷键 ==========
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSpotlightOpen(true);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "n") {
        e.preventDefault();
        if (isLoggedIn) setIsAddModalOpen(true);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "j") {
        e.preventDefault();
        if (isLoggedIn && widgetVisibility.aiAssistant !== false) {
          setIsAiAssistantOpen(prev => !prev);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLoggedIn]);

  // ========== 事件处理函数 ==========
  const handleDockClick = (id: string) => {
    switch (id) {
      case "home":
        setCurrentPage("home");
        break;
      case "search":
        setIsSpotlightOpen(true);
        break;
      case "ai":
        if (isLoggedIn && widgetVisibility.aiAssistant !== false) {
          setIsAiAssistantOpen(true);
        }
        break;
      case "add":
        if (isLoggedIn) setIsAddModalOpen(true);
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
        // 保存成功后刷新数据，确保前端状态与后端一致
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

  // ========== 数据分组（useMemo 优化，避免每次渲染重新计算） ==========
  const pinnedBookmarks = useMemo(() => bookmarks.filter((b) => b.isPinned), [bookmarks]);

  const bookmarksByCategory = useMemo(() => categories.reduce((acc, cat) => {
    const categoryBookmarks = bookmarks.filter((b) => b.category === cat.id);
    acc[cat.id] = categoryBookmarks.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return a.orderIndex - b.orderIndex;
    });
    return acc;
  }, {} as Record<string, Bookmark[]>), [bookmarks, categories]);

  // ========== 页面路由 ==========
  // 后台登录页面
  if (currentPage === "admin-login") {
    return (
      <AdminLogin
        onLogin={handleAdminLogin}
        onBack={() => setCurrentPage("home")}
        isDark={isDark}
      />
    );
  }

  // 强制修改密码页面
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

  // 后台管理页面
  if (currentPage === "admin") {
    if (!isLoggedIn) {
      setCurrentPage("admin-login");
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

  return (
    <>
      {/* 壁纸背景层 - 独立于 BackgroundWrapper，位于最底层 */}
      {wallpaperEnabled && wallpaperImageSrc && (
        <>
          <div
            className="fixed inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url(${wallpaperImageSrc})`,
              filter: `blur(${wallpaper?.blur || 0}px)`,
              transform: 'scale(1.1)',
              zIndex: 0,
            }}
          />
          {/* 遮罩层 */}
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
      {/* Meteors Effect - 精简模式下不渲染 */}
      {!isLiteMode && <Meteors number={15} />}

      {/* Sidebar Navigation */}
      <SidebarNav
        items={categories
          .filter((cat) => (bookmarksByCategory[cat.id] || []).length > 0)
          .map((cat) => ({
            id: cat.id,
            name: cat.name,
            icon: cat.icon,
            color: cat.color,
            count: (bookmarksByCategory[cat.id] || []).length,
          }))}
        pinnedCount={pinnedBookmarks.length}
      />

      {/* Main Content */}
      <div className="min-h-screen px-4 sm:px-6 lg:px-8 pb-32">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <HeroSection
            formattedTime={formattedTime}
            formattedDate={formattedDate}
            lunarDate={lunarDate}
            greeting={greeting}
            isLiteMode={isLiteMode}
            showWeather={showWeather}
            showLunar={showLunar}
            weather={weather}
            weatherLoading={weatherLoading}
            weatherCity={weatherCity}
            hasWallpaper={wallpaperEnabled && !!wallpaperImageSrc}
            onRefreshWeather={refreshWeather}
            onCityChange={handleWeatherCityChange}
            onOpenSearch={() => setIsSpotlightOpen(true)}
          />

          {/* Read Later Section */}
          <ReadLaterSection
            bookmarks={bookmarks}
            isLiteMode={isLiteMode ?? false}
            onMarkRead={toggleRead}
            onRemove={toggleReadLater}
          />

          {/* Pinned Bookmarks - Bento Grid */}
          {pinnedBookmarks.length > 0 ? (
            <motion.section
              className="mb-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
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
                {/* Widget 尺寸 S/M/L 切换 */}
                {(widgetVisibility.systemMonitor !== false || widgetVisibility.hardwareIdentity !== false || widgetVisibility.vitalSigns !== false || widgetVisibility.networkTelemetry !== false || widgetVisibility.processMatrix !== false) && (
                  <div className="ml-auto">
                    <WidgetSizeModeToggle widgetSizeMode={widgetSizeMode} onChange={handleWidgetSizeModeChange} />
                  </div>
                )}
              </div>

              <BentoGrid>
                {/* System Monitor Cards */}
                {widgetVisibility.systemMonitor !== false && (
                  <BentoGridItem key="system-monitor" colSpan={2} rowSpan={widgetSizeMode === 'S' ? 1 : 2} spotlightColor={isLiteMode ? undefined : "rgba(6, 182, 212, 0.15)"} delay={0}>
                    <SystemMonitorCard forceCollapsed={widgetSizeMode === 'S' ? true : widgetSizeMode === 'L' ? false : undefined} />
                  </BentoGridItem>
                )}
                {widgetVisibility.hardwareIdentity !== false && (
                  <BentoGridItem key="hardware-specs" colSpan={2} rowSpan={widgetSizeMode === 'S' ? 1 : 2} spotlightColor={isLiteMode ? undefined : "rgba(6, 182, 212, 0.1)"} delay={0.1}>
                    <HardwareIdentityCard forceCollapsed={widgetSizeMode === 'S' ? true : widgetSizeMode === 'L' ? false : undefined} />
                  </BentoGridItem>
                )}
                {widgetVisibility.vitalSigns !== false && (
                  <BentoGridItem key="vital-signs" colSpan={2} rowSpan={widgetSizeMode === 'S' ? 1 : 2} spotlightColor={isLiteMode ? undefined : "rgba(6, 182, 212, 0.12)"} delay={0.15}>
                    <VitalSignsCard forceCollapsed={widgetSizeMode === 'S' ? true : widgetSizeMode === 'L' ? false : undefined} />
                  </BentoGridItem>
                )}
                {widgetVisibility.networkTelemetry !== false && (
                  <BentoGridItem key="network-telemetry" colSpan={2} rowSpan={widgetSizeMode === 'S' ? 1 : 2} spotlightColor={isLiteMode ? undefined : "rgba(168, 85, 247, 0.12)"} delay={0.2}>
                    <NetworkTelemetryCard forceCollapsed={widgetSizeMode === 'S' ? true : widgetSizeMode === 'L' ? false : undefined} />
                  </BentoGridItem>
                )}
                {widgetVisibility.processMatrix !== false && (
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
                    />
                  </BentoGridItem>
                ))}
              </BentoGrid>
            </motion.section>
          ) : (
            /* 独立显示系统监控卡片 */
            <motion.section className="mb-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
              {/* Widget 尺寸 S/M/L 切换 */}
              {(widgetVisibility.systemMonitor !== false || widgetVisibility.hardwareIdentity !== false || widgetVisibility.vitalSigns !== false || widgetVisibility.networkTelemetry !== false || widgetVisibility.processMatrix !== false) && (
                <div className="flex items-center justify-end mb-4">
                  <WidgetSizeModeToggle widgetSizeMode={widgetSizeMode} onChange={handleWidgetSizeModeChange} />
                </div>
              )}
              <BentoGrid>
                {widgetVisibility.systemMonitor !== false && (
                  <BentoGridItem key="system-monitor-standalone" colSpan={2} rowSpan={widgetSizeMode === 'S' ? 1 : 2} spotlightColor={isLiteMode ? undefined : "rgba(6, 182, 212, 0.15)"} delay={0}>
                    <SystemMonitorCard forceCollapsed={widgetSizeMode === 'S' ? true : widgetSizeMode === 'L' ? false : undefined} />
                  </BentoGridItem>
                )}
                {widgetVisibility.hardwareIdentity !== false && (
                  <BentoGridItem key="hardware-specs-standalone" colSpan={2} rowSpan={widgetSizeMode === 'S' ? 1 : 2} spotlightColor={isLiteMode ? undefined : "rgba(6, 182, 212, 0.1)"} delay={0.1}>
                    <HardwareIdentityCard forceCollapsed={widgetSizeMode === 'S' ? true : widgetSizeMode === 'L' ? false : undefined} />
                  </BentoGridItem>
                )}
                {widgetVisibility.vitalSigns !== false && (
                  <BentoGridItem key="vital-signs-standalone" colSpan={2} rowSpan={widgetSizeMode === 'S' ? 1 : 2} spotlightColor={isLiteMode ? undefined : "rgba(6, 182, 212, 0.12)"} delay={0.15}>
                    <VitalSignsCard forceCollapsed={widgetSizeMode === 'S' ? true : widgetSizeMode === 'L' ? false : undefined} />
                  </BentoGridItem>
                )}
                {widgetVisibility.networkTelemetry !== false && (
                  <BentoGridItem key="network-telemetry-standalone" colSpan={2} rowSpan={widgetSizeMode === 'S' ? 1 : 2} spotlightColor={isLiteMode ? undefined : "rgba(168, 85, 247, 0.12)"} delay={0.2}>
                    <NetworkTelemetryCard forceCollapsed={widgetSizeMode === 'S' ? true : widgetSizeMode === 'L' ? false : undefined} />
                  </BentoGridItem>
                )}
                {widgetVisibility.processMatrix !== false && (
                  <BentoGridItem key="process-matrix-standalone" colSpan={2} rowSpan={widgetSizeMode === 'S' ? 1 : 2} spotlightColor={isLiteMode ? undefined : "rgba(34, 197, 94, 0.12)"} delay={0.25}>
                    <ProcessMatrixCard forceCollapsed={widgetSizeMode === 'S' ? true : widgetSizeMode === 'L' ? false : undefined} />
                  </BentoGridItem>
                )}
              </BentoGrid>
            </motion.section>
          )}

          {/* Category Sections - 支持拖拽排序 */}
          <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={handleDragCancel} measuring={measuringConfig}>
            {categories.map((category, catIndex) => {
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
                  totalBookmarkCount={bookmarks.length}
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
                  isLoggedIn={isLoggedIn}
                />
              );
            })}

            {/* 拖拽覆盖层 */}
            <BookmarkDragOverlay activeBookmark={activeBookmark} cardViewMode={cardViewMode} />
          </DndContext>

          {/* Empty State */}
          {bookmarks.length === 0 && !isLoading && (
            <EmptyState isLiteMode={isLiteMode ?? false} isLoggedIn={isLoggedIn} onAddBookmark={() => setIsAddModalOpen(true)} />
          )}
        </div>
      </div>

      {/* Footer 备案信息 */}
      {siteSettings.footerText && (
        <div className="w-full text-center pb-20 md:pb-24 pt-8 px-4">
          <p
            className="text-xs leading-relaxed"
            style={{ color: 'var(--color-text-muted)' }}
            dangerouslySetInnerHTML={{ __html: siteSettings.footerText }}
          />
        </div>
      )}

      {/* Modals */}
      <SpotlightSearch
        isOpen={isSpotlightOpen}
        onClose={() => setIsSpotlightOpen(false)}
        bookmarks={bookmarks}
        onAddBookmark={handleAddFromSpotlight}
      />

      {isLoggedIn && widgetVisibility.aiAssistant !== false && (
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

      {/* Context Menu */}
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
          })}
        />
      )}

      <ScrollToTop threshold={400} />
    </BackgroundWrapper>

    {/* 以下组件放在 BackgroundWrapper 外部，避免被其 stacking context 限制 z-index */}

    {/* 桌面端：Dock（自主管理 fixed 定位 + 自由拖拽） */}
    <div className="hidden md:block">
      <FloatingDock
        items={filteredDockItems.map((item) => ({
          ...item,
          onClick: item.href ? undefined : (item.onClick || (() => handleDockClick(item.id))),
        }))}
      />
    </div>

    {/* 桌面端迷你监控 — 固定位置 */}
    {widgetVisibility.dockMiniMonitor !== false && (
      <div className="hidden md:flex fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
        <SystemMonitor initialMode="mini" size="sm" showLoading={false} />
      </div>
    )}

    {/* 移动端：底部固定栏（状态栏 + 能量球） */}
    <div className="md:hidden">
      <MobileFloatingDock
        items={filteredDockItems
          .filter((item) => !item.href)
          .map((item) => ({
            id: item.id,
            label: item.title,
            icon: item.IconComponent,
            onClick: item.onClick || (() => handleDockClick(item.id)),
            isActive: item.id === "home",
          }))}
        leftSlot={
          widgetVisibility.mobileTicker !== false
            ? <SystemMonitor initialMode="inline" compact showLoading={false} />
            : undefined
        }
      />
    </div>
    </>
  );
}

// ========== 分类区书签卡片（React.memo 优化） ==========
const MAX_ANIMATED_INDEX = 12; // 超过此索引的卡片不再有递增延迟动画

const MemoizedBookmarkItem = React.memo(function MemoizedBookmarkItem({
  bookmark,
  index,
  category,
  isLiteMode,
  isInternal,
  lightweight,
  cardViewMode = 'standard',
  onContextMenu,
}: {
  bookmark: Bookmark;
  index: number;
  category: import("./types/bookmark").Category;
  isLiteMode: boolean | undefined;
  isInternal: boolean;
  lightweight: boolean;
  cardViewMode?: 'compact' | 'standard' | 'comfortable';
  onContextMenu: (e: React.MouseEvent, bookmark: Bookmark) => void;
}) {
  const animDelay = index < MAX_ANIMATED_INDEX ? index * 0.04 : 0;
  const isCompact = cardViewMode === 'compact';

  // 轻量模式：跳过 framer-motion 入场动画
  const card = (
    <SpotlightCard
      className="h-full cursor-pointer"
      size={isCompact ? 'sm' : 'md'}
      spotlightColor={isLiteMode ? "transparent" : `${category.color}20`}
      lightweight={lightweight}
      onClick={() => { visitsApi.track(bookmark.id).catch(console.error); window.open(getBookmarkUrl(bookmark, isInternal), "_blank") }}
      onContextMenu={(e) => onContextMenu(e, bookmark)}
    >
      <div className={`flex ${isCompact ? 'flex-row items-center gap-3' : 'flex-col'} h-full`}>
        <div
          className={`${isCompact ? 'w-8 h-8' : 'w-10 h-10'} rounded-xl flex items-center justify-center ${isCompact ? '' : 'mb-4'} flex-shrink-0`}
          style={{ background: "var(--color-bg-tertiary)" }}
        >
          {bookmark.iconUrl ? (
            <img src={bookmark.iconUrl} alt="" className={`${isCompact ? 'w-4 h-4' : 'w-5 h-5'} object-contain`} loading="lazy" />
          ) : bookmark.icon ? (
            <IconRenderer icon={bookmark.icon} className={isCompact ? 'w-4 h-4' : 'w-5 h-5'} style={{ color: "var(--color-primary)" }} />
          ) : bookmark.favicon ? (
            <img src={bookmark.favicon} alt="" className={`${isCompact ? 'w-4 h-4' : 'w-5 h-5'}`} loading="lazy" />
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
                <span
                  key={tag}
                  className="px-1.5 py-0.5 rounded-md text-[10px] leading-tight font-medium truncate max-w-[80px]"
                  style={{
                    background: color.bg,
                    color: color.text,
                    border: `1px solid ${color.border}`,
                  }}
                  title={tag}
                >
                  #{tag}
                </span>
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
    // 轻量模式：不使用 framer-motion 包裹
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

// ========== 分类骨架屏占位 ==========
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

// ========== 视图切换按钮组 ==========
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

// ========== Widget 尺寸 S/M/L 切换按钮 ==========
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

// ========== 分类区组件（支持折叠展开 + 懒渲染） ==========
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
  isLoggedIn?: boolean;
}) {
  const { t } = useTranslation();
  const PAGE_SIZE = 100; // 每次点击加载更多的数量
  const baseShowCount = initialShowCount || 8;
  const needsCollapse = collapseThreshold > 0 && categoryBookmarks.length > collapseThreshold;
  const [displayCount, setDisplayCount] = useState(needsCollapse ? baseShowCount : categoryBookmarks.length);
  const isFullyExpanded = displayCount >= categoryBookmarks.length;
  const visibleBookmarks = isFullyExpanded ? categoryBookmarks : categoryBookmarks.slice(0, displayCount);
  const hiddenCount = categoryBookmarks.length - displayCount;

  // 懒渲染：前2个分类立即渲染，后续分类进入视口时才渲染
  const [lazyRef, shouldRender] = useLazyRender('300px');
  const isEager = catIndex < 2; // 前2个分类立即渲染，无需等待
  const doRender = isEager || shouldRender;

  // 轻量模式：总书签超过 50 个时启用，减少 framer-motion 和 spotlight 开销
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
      {/* 背景装饰文字 */}
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
        {/* 视图切换 - 仅首个分类显示 */}
        {catIndex === 0 && onViewModeChange && (
          <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
            <ViewModeToggle cardViewMode={cardViewMode} onChange={onViewModeChange} />
          </div>
        )}
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
            />
          )) : null}
        </div>
      </SortableContext>

      {/* 骨架屏：懒渲染未激活时显示 */}
      {!doRender && (
        <CategorySkeleton count={categoryBookmarks.length} color={category.color || '#667eea'} cardViewMode={cardViewMode} />
      )}

      {/* 展开/折叠按钮 */}
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
