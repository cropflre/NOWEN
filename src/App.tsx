import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import {
  Pin,
  ExternalLink,
  Edit2,
} from "lucide-react";

// UI 组件
import { AuroraBackground } from "./components/ui/aurora-background";
import { BentoGrid, BentoGridItem } from "./components/ui/bento-grid";
import { SpotlightCard } from "./components/ui/spotlight-card";
import { FloatingDock } from "./components/ui/floating-dock";
import { MobileFloatingDock } from "./components/ui/mobile-floating-dock";
import { SpotlightSearch } from "./components/ui/spotlight-search";
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
import { useTheme } from "./hooks/useTheme";
import { useTime } from "./hooks/useTime";
import { useWeather } from "./hooks/useWeather";
import { useSiteSettings } from "./hooks/useSiteSettings";
import { useDragAndDrop } from "./hooks/useDragAndDrop";
import { useAuth } from "./hooks/useAuth";
import { useNetworkEnv, getBookmarkUrl } from "./hooks/useNetworkEnv";

// 工具函数和类型
import { Bookmark } from "./types/bookmark";
import { IconRenderer } from "./components/IconRenderer";
import { handleQuotesChange } from "./data/quotes";
import { createDockItems, filterDockItems } from "./config/dockItems";

function App() {
  // ========== 状态管理 ==========
  const [isSpotlightOpen, setIsSpotlightOpen] = useState(false);
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
  const { isDark, toggleDarkMode } = useTheme();
  const { t, i18n } = useTranslation();
  const { isInternal } = useNetworkEnv();

  // 站点设置
  const {
    siteSettings,
    setSiteSettings,
    isLiteMode,
    showWeather,
    showLunar,
    menuVisibility,
    widgetVisibility,
  } = useSiteSettings();

  // 认证状态
  const {
    currentPage,
    adminUsername,
    isLoggedIn,
    setCurrentPage,
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
  } = useDragAndDrop({ bookmarks, reorderBookmarks });

  // 天气数据
  const { weather, loading: weatherLoading, refresh: refreshWeather } = useWeather(showWeather);

  // ========== Dock 配置 ==========
  const toggleLanguage = useCallback(() => {
    const nextLang = i18n.language === 'en' ? 'zh' : 'en';
    i18n.changeLanguage(nextLang);
  }, [i18n]);

  const dockItems = createDockItems(isDark, toggleDarkMode, t, toggleLanguage);
  const filteredDockItems = filterDockItems(dockItems, menuVisibility);

  // ========== 全局快捷键 ==========
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSpotlightOpen(true);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "n") {
        e.preventDefault();
        setIsAddModalOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // ========== 事件处理函数 ==========
  const handleDockClick = (id: string) => {
    switch (id) {
      case "home":
        setCurrentPage("home");
        break;
      case "search":
        setIsSpotlightOpen(true);
        break;
      case "add":
        setIsAddModalOpen(true);
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
    (data: Omit<Bookmark, "id" | "orderIndex" | "createdAt" | "updatedAt">) => {
      if (editingBookmark) {
        updateBookmark(editingBookmark.id, data);
      } else {
        addBookmark(data);
      }
      setEditingBookmark(null);
      setPendingUrl("");
    },
    [editingBookmark, updateBookmark, addBookmark]
  );

  const handleDelete = useCallback(
    (id: string) => {
      if (confirm(t('bookmark.delete_confirm'))) {
        deleteBookmark(id);
      }
    },
    [deleteBookmark, t]
  );

  // ========== 数据分组 ==========
  const pinnedBookmarks = bookmarks.filter((b) => b.isPinned);
  // 分类书签：置顶的书签也显示在其所属分类中（置顶优先排序）
  const bookmarksByCategory = categories.reduce((acc, cat) => {
    const categoryBookmarks = bookmarks.filter((b) => b.category === cat.id);
    // 置顶的排在前面
    acc[cat.id] = categoryBookmarks.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return a.orderIndex - b.orderIndex;
    });
    return acc;
  }, {} as Record<string, Bookmark[]>);

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
            onRefreshWeather={refreshWeather}
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
              </div>

              <BentoGrid>
                {/* System Monitor Cards */}
                {widgetVisibility.systemMonitor !== false && (
                  <BentoGridItem key="system-monitor" colSpan={2} rowSpan={2} spotlightColor={isLiteMode ? undefined : "rgba(6, 182, 212, 0.15)"} delay={0}>
                    <SystemMonitorCard />
                  </BentoGridItem>
                )}
                {widgetVisibility.hardwareIdentity !== false && (
                  <BentoGridItem key="hardware-specs" colSpan={2} rowSpan={2} spotlightColor={isLiteMode ? undefined : "rgba(6, 182, 212, 0.1)"} delay={0.1}>
                    <HardwareIdentityCard />
                  </BentoGridItem>
                )}
                {widgetVisibility.vitalSigns !== false && (
                  <BentoGridItem key="vital-signs" colSpan={2} rowSpan={2} spotlightColor={isLiteMode ? undefined : "rgba(6, 182, 212, 0.12)"} delay={0.15}>
                    <VitalSignsCard />
                  </BentoGridItem>
                )}
                {widgetVisibility.networkTelemetry !== false && (
                  <BentoGridItem key="network-telemetry" colSpan={2} rowSpan={2} spotlightColor={isLiteMode ? undefined : "rgba(168, 85, 247, 0.12)"} delay={0.2}>
                    <NetworkTelemetryCard />
                  </BentoGridItem>
                )}
                {widgetVisibility.processMatrix !== false && (
                  <BentoGridItem key="process-matrix" colSpan={2} rowSpan={2} spotlightColor={isLiteMode ? undefined : "rgba(34, 197, 94, 0.12)"} delay={0.25}>
                    <ProcessMatrixCard />
                  </BentoGridItem>
                )}

                {pinnedBookmarks.map((bookmark, index) => (
                  <BentoGridItem
                    key={bookmark.id}
                    colSpan={1}
                    rowSpan={1}
                    spotlightColor={isLiteMode ? undefined : "rgba(234, 179, 8, 0.15)"}
                    onClick={() => window.open(getBookmarkUrl(bookmark, isInternal), "_blank")}
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
              <BentoGrid>
                {widgetVisibility.systemMonitor !== false && (
                  <BentoGridItem key="system-monitor-standalone" colSpan={2} rowSpan={2} spotlightColor={isLiteMode ? undefined : "rgba(6, 182, 212, 0.15)"} delay={0}>
                    <SystemMonitorCard />
                  </BentoGridItem>
                )}
                {widgetVisibility.hardwareIdentity !== false && (
                  <BentoGridItem key="hardware-specs-standalone" colSpan={2} rowSpan={2} spotlightColor={isLiteMode ? undefined : "rgba(6, 182, 212, 0.1)"} delay={0.1}>
                    <HardwareIdentityCard />
                  </BentoGridItem>
                )}
                {widgetVisibility.vitalSigns !== false && (
                  <BentoGridItem key="vital-signs-standalone" colSpan={2} rowSpan={2} spotlightColor={isLiteMode ? undefined : "rgba(6, 182, 212, 0.12)"} delay={0.15}>
                    <VitalSignsCard />
                  </BentoGridItem>
                )}
                {widgetVisibility.networkTelemetry !== false && (
                  <BentoGridItem key="network-telemetry-standalone" colSpan={2} rowSpan={2} spotlightColor={isLiteMode ? undefined : "rgba(168, 85, 247, 0.12)"} delay={0.2}>
                    <NetworkTelemetryCard />
                  </BentoGridItem>
                )}
                {widgetVisibility.processMatrix !== false && (
                  <BentoGridItem key="process-matrix-standalone" colSpan={2} rowSpan={2} spotlightColor={isLiteMode ? undefined : "rgba(34, 197, 94, 0.12)"} delay={0.25}>
                    <ProcessMatrixCard />
                  </BentoGridItem>
                )}
              </BentoGrid>
            </motion.section>
          )}

          {/* Category Sections - 支持拖拽排序 */}
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            {categories.map((category, catIndex) => {
              const categoryBookmarks = bookmarksByCategory[category.id] || [];
              if (categoryBookmarks.length === 0) return null;

              return (
                <motion.section
                  key={category.id}
                  className="mb-12 relative group"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2 + catIndex * 0.1 }}
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
                      {(() => {
                        return <IconRenderer icon={category.icon} className="w-4 h-4" />;
                      })()}
                    </div>
                    <h2 className="text-xl font-medium tracking-wide" style={{ color: "var(--color-text-primary)" }}>
                      {category.name}
                    </h2>
                    <span className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                      {categoryBookmarks.length}
                    </span>
                    <button
                      onClick={() => {
                        setEditingCategory(category);
                        setCategoryModalMode('edit');
                        setIsCategoryModalOpen(true);
                      }}
                      className="ml-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-white/10 transition-all"
                      style={{ color: "var(--color-text-muted)" }}
                      title="编辑分类"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>

                  <SortableContext items={categoryBookmarks.map(b => b.id)} strategy={rectSortingStrategy}>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 relative z-10">
                      {categoryBookmarks.map((bookmark, index) => (
                        <SortableCard key={bookmark.id} id={bookmark.id}>
                          <motion.div
                            className="h-full"
                            initial={{ opacity: 0, y: isLiteMode ? 10 : 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <SpotlightCard
                              className="h-full cursor-pointer"
                              spotlightColor={isLiteMode ? "transparent" : `${category.color}20`}
                              onClick={() => window.open(getBookmarkUrl(bookmark, isInternal), "_blank")}
                              onContextMenu={(e) => handleContextMenu(e, bookmark)}
                            >
                              <div className="flex flex-col h-full">
                                <div
                                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                                  style={{ background: "var(--color-bg-tertiary)" }}
                                >
                                  {bookmark.iconUrl ? (
                                    <img src={bookmark.iconUrl} alt="" className="w-5 h-5 object-contain" />
                                  ) : bookmark.icon ? (
                                    <IconRenderer icon={bookmark.icon} className="w-5 h-5" style={{ color: "var(--color-primary)" }} />
                                  ) : bookmark.favicon ? (
                                    <img src={bookmark.favicon} alt="" className="w-5 h-5" />
                                  ) : (
                                    <ExternalLink className="w-5 h-5" style={{ color: "var(--color-text-muted)" }} />
                                  )}
                                </div>
                                <h3 className="font-medium line-clamp-1 mb-1" style={{ color: "var(--color-text-primary)" }}>
                                  {bookmark.title}
                                </h3>
                                <p className="text-sm line-clamp-2 flex-1" style={{ color: "var(--color-text-muted)" }}>
                                  {bookmark.description || new URL(bookmark.url).hostname}
                                </p>
                              </div>
                            </SpotlightCard>
                          </motion.div>
                        </SortableCard>
                      ))}
                    </div>
                  </SortableContext>
                </motion.section>
              );
            })}

            {/* 拖拽覆盖层 */}
            <BookmarkDragOverlay activeBookmark={activeBookmark} />
          </DndContext>

          {/* Empty State */}
          {bookmarks.length === 0 && !isLoading && (
            <EmptyState isLiteMode={isLiteMode ?? false} onAddBookmark={() => setIsAddModalOpen(true)} />
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

      {/* Floating Dock - 桌面端 */}
      <div className="hidden md:flex fixed bottom-6 left-1/2 -translate-x-1/2 items-end gap-4 z-50">
        {widgetVisibility.dockMiniMonitor !== false && (
          <SystemMonitor initialMode="mini" size="sm" showLoading={false} />
        )}
        <FloatingDock
          items={filteredDockItems.map((item) => ({
            ...item,
            onClick: item.href ? undefined : (item.onClick || (() => handleDockClick(item.id))),
          }))}
        />
      </div>

      {/* Mobile Floating Dock */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex flex-col">
        {widgetVisibility.mobileTicker !== false && (
          <SystemMonitor initialMode="inline" compact showLoading={false} />
        )}
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
        />
      </div>

      {/* Modals */}
      <SpotlightSearch
        isOpen={isSpotlightOpen}
        onClose={() => setIsSpotlightOpen(false)}
        bookmarks={bookmarks}
        onAddBookmark={handleAddFromSpotlight}
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
    </>
  );
}

export default App;
