import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  Home,
  Bookmark as BookmarkIcon,
  Github,
  ExternalLink,
  Pin,
  BookMarked,
  Command,
  LayoutDashboard,
  MapPin,
  Droplets,
  Wind,
  RefreshCw,
  Sun,
  Moon,
} from "lucide-react";
import { AuroraBackground } from "./components/ui/aurora-background";
import { Card3D, CardItem } from "./components/ui/3d-card";
import { BentoGrid, BentoGridItem } from "./components/ui/bento-grid";
import { SpotlightCard } from "./components/ui/spotlight-card";
import { FloatingDock } from "./components/ui/floating-dock";
import { MobileFloatingDock } from "./components/ui/mobile-floating-dock";
import { SpotlightSearch } from "./components/ui/spotlight-search";
import { Typewriter } from "./components/ui/typewriter";
import { Meteors, Sparkles } from "./components/ui/effects";
import { BreathingDot } from "./components/ui/advanced-effects";
import { Button as MovingBorderButton } from "./components/ui/moving-border";
import { ScrollToTop } from "./components/ui/scroll-to-top";
import { SidebarNav } from "./components/ui/sidebar-nav";
import { AddBookmarkModal } from "./components/AddBookmarkModal";
import { BookmarkCardContent } from "./components/BookmarkCardContent";
import { ContextMenu, useBookmarkContextMenu } from "./components/ContextMenu";
import { IconManager } from "./components/IconManager";
import { Admin } from "./pages/Admin";
import { AdminLogin } from "./components/AdminLogin";
import { ForcePasswordChange } from "./components/ForcePasswordChange";
import { SystemMonitorCard } from "./components/SystemMonitorCard";
import { HardwareIdentityCard } from "./components/HardwareIdentityCard";
import { VitalSignsCard } from "./components/VitalSignsCard";
import { NetworkTelemetryCard } from "./components/NetworkTelemetryCard";
import { ProcessMatrixCard } from "./components/ProcessMatrixCard";
import { SystemMonitor } from "./components/monitor";
import { useBookmarkStore } from "./hooks/useBookmarkStore";
import { useTheme } from "./hooks/useTheme";
import { useTime } from "./hooks/useTime";
import { useWeather, getWeatherIcon } from "./hooks/useWeather";
import { Bookmark } from "./types/bookmark";
import { getIconComponent } from "./lib/utils";
import {
  checkAuthStatus,
  clearAuthStatus,
  fetchSettings,
  fetchQuotes,
  SiteSettings,
} from "./lib/api";
import {
  setActiveQuotes,
  getRandomWisdom,
  handleQuotesChange,
} from "./data/quotes";

// Dock 导航项生成函数
const createDockItems = (isDark: boolean, onToggleTheme: () => void) => [
  {
    id: "home",
    title: "首页",
    icon: <Home className="w-5 h-5" />,
    IconComponent: Home,
  },
  {
    id: "search",
    title: "搜索",
    icon: <Search className="w-5 h-5" />,
    IconComponent: Search,
  },
  {
    id: "add",
    title: "添加",
    icon: <Plus className="w-5 h-5" />,
    IconComponent: Plus,
  },
  {
    id: "theme",
    title: isDark ? "切换日间模式" : "切换夜间模式",
    icon: isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />,
    IconComponent: isDark ? Sun : Moon,
    onClick: onToggleTheme,
  },
  {
    id: "admin",
    title: "管理",
    icon: <LayoutDashboard className="w-5 h-5" />,
    IconComponent: LayoutDashboard,
  },
  {
    id: "github",
    title: "GitHub",
    icon: <Github className="w-5 h-5" />,
    IconComponent: Github,
    href: "https://github.com/cropflre/NOWEN",
  },
];

// ========== VIBE CODING: Lite Background 组件 ==========
// 极简背景，没有任何 JS 动画，只有 CSS 渐变 - 禅 (Zen)
const LiteBackground = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen w-full relative bg-slate-50 dark:bg-slate-950 transition-colors duration-500">
    {/* 静态的、优雅的渐变背景 */}
    <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-white/50 to-purple-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 z-0" />
    {/* 静态噪点增加质感 */}
    <div className="absolute inset-0 opacity-[0.015] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] z-0 pointer-events-none" />
    <div className="relative z-10">{children}</div>
  </div>
);

function App() {
  const [currentPage, setCurrentPage] = useState<
    "home" | "admin" | "admin-login" | "force-password-change"
  >("home");
  const [isSpotlightOpen, setIsSpotlightOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isIconManagerOpen, setIsIconManagerOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const [pendingUrl, setPendingUrl] = useState("");
  const [adminUsername, setAdminUsername] = useState<string>("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({
    siteTitle: "Nebula Portal",
    siteFavicon: "",
    enableBeamAnimation: true,
    enableLiteMode: false, // 默认关闭精简模式
    enableWeather: true,   // 默认开启天气
    enableLunar: true,     // 默认开启农历
    widgetVisibility: {
      systemMonitor: true,
      hardwareIdentity: true,
      vitalSigns: true,
      networkTelemetry: true,
      processMatrix: true,
      dockMiniMonitor: true,
      mobileTicker: true,
    },
  });
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  // VIBE CODING: 精简模式快捷访问
  const isLiteMode = siteSettings.enableLiteMode;
  // 天气和农历开关
  const showWeather = siteSettings.enableWeather !== false;
  const showLunar = siteSettings.enableLunar !== false;

  // 仪表可见性快捷访问 - 设置未加载完成时默认隐藏所有小部件避免闪烁
  const widgetVisibility = settingsLoaded
    ? siteSettings.widgetVisibility || {
        systemMonitor: true,
        hardwareIdentity: true,
        vitalSigns: true,
        networkTelemetry: true,
        processMatrix: true,
        dockMiniMonitor: true,
        mobileTicker: true,
      }
    : {
        systemMonitor: false,
        hardwareIdentity: false,
        vitalSigns: false,
        networkTelemetry: false,
        processMatrix: false,
        dockMiniMonitor: false,
        mobileTicker: false,
      };

  // 右键菜单状态
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
    bookmark: Bookmark | null;
  }>({ isOpen: false, position: { x: 0, y: 0 }, bookmark: null });

  const { getMenuItems } = useBookmarkContextMenu();

  const { greeting, formattedTime, formattedDate, lunarDate } = useTime();

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
    addCategory,
    updateCategory,
    deleteCategory,
    addCustomIcon,
    deleteCustomIcon,
    refreshData,
  } = useBookmarkStore();

  const { isDark, toggleDarkMode } = useTheme();

  // 创建 Dock 导航项（响应主题变化）
  const dockItems = createDockItems(isDark, toggleDarkMode);

  // 天气数据
  const { weather, loading: weatherLoading, refresh: refreshWeather } = useWeather(showWeather);

  // 初始化时检查登录状态和加载站点设置
  useEffect(() => {
    const { isValid, username, requirePasswordChange } = checkAuthStatus();
    if (isValid && username) {
      setIsLoggedIn(true);
      setAdminUsername(username);
      // 检查是否需要强制修改密码
      if (requirePasswordChange) {
        setCurrentPage("force-password-change");
      }
    }

    // 加载站点设置
    fetchSettings()
      .then((settings) => {
        setSiteSettings(settings);
        setSettingsLoaded(true);
        // 应用站点标题
        if (settings.siteTitle) {
          document.title = settings.siteTitle;
        }
        // 应用站点图标
        if (settings.siteFavicon) {
          const link = document.querySelector(
            "link[rel~='icon']"
          ) as HTMLLinkElement;
          if (link) {
            link.href = settings.siteFavicon;
          } else {
            const newLink = document.createElement("link");
            newLink.rel = "icon";
            newLink.href = settings.siteFavicon;
            document.head.appendChild(newLink);
          }
        }
      })
      .catch((err) => {
        console.error(err);
        setSettingsLoaded(true); // 即使出错也标记为已加载，使用默认设置
      });

    // 加载名言
    fetchQuotes()
      .then((data) => {
        setActiveQuotes(data.quotes, data.useDefaultQuotes);
      })
      .catch(console.error);
  }, []);

  // 全局快捷键
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

  // 检查是否已登录后台
  const checkAdminAuth = () => {
    const { isValid, username, requirePasswordChange } = checkAuthStatus();
    if (isValid && username) {
      setAdminUsername(username);
      // 如果需要强制修改密码，返回特殊标识
      if (requirePasswordChange) {
        return "require-password-change";
      }
      return true;
    }
    return false;
  };

  // Dock 点击处理
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
        // 检查登录状态
        const authResult = checkAdminAuth();
        if (authResult === "require-password-change") {
          setCurrentPage("force-password-change");
        } else if (authResult) {
          setCurrentPage("admin");
        } else {
          setCurrentPage("admin-login");
        }
        break;
    }
  };

  // 后台登录成功
  const handleAdminLogin = (
    username: string,
    requirePasswordChange?: boolean
  ) => {
    setAdminUsername(username);
    setIsLoggedIn(true);
    // 如果需要强制修改密码，跳转到密码修改页面
    if (requirePasswordChange) {
      setCurrentPage("force-password-change");
    } else {
      setCurrentPage("admin");
    }
  };

  // 密码修改成功后的处理
  const handlePasswordChangeSuccess = () => {
    setCurrentPage("admin");
  };

  // 后台退出登录
  const handleAdminLogout = () => {
    clearAuthStatus();
    setAdminUsername("");
    setIsLoggedIn(false);
    setCurrentPage("home");
  };

  // 右键菜单处理
  const handleContextMenu = useCallback(
    (e: React.MouseEvent, bookmark: Bookmark) => {
      if (!isLoggedIn) return; // 未登录不显示右键菜单

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
      if (confirm("确定要删除这个书签吗？")) {
        deleteBookmark(id);
      }
    },
    [deleteBookmark]
  );

  // 分组书签
  const pinnedBookmarks = bookmarks.filter((b) => b.isPinned);
  const readLaterBookmarks = bookmarks.filter(
    (b) => b.isReadLater && !b.isRead
  );
  const bookmarksByCategory = categories.reduce((acc, cat) => {
    acc[cat.id] = bookmarks.filter((b) => b.category === cat.id && !b.isPinned);
    return acc;
  }, {} as Record<string, Bookmark[]>);

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

  // 选择背景包装组件
  const BackgroundWrapper = isLiteMode ? LiteBackground : AuroraBackground;
  const backgroundProps = isLiteMode
    ? {}
    : { showBeams: siteSettings.enableBeamAnimation !== false };

  return (
    <BackgroundWrapper {...backgroundProps}>
      {/* Meteors Effect - 精简模式下不渲染 */}
      {!isLiteMode && <Meteors number={15} />}

      {/* Sidebar Navigation - 快速定位分类 */}
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
          <motion.section
            className="pt-20 pb-16 text-center relative"
            initial={{ opacity: 0, y: isLiteMode ? 10 : 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: isLiteMode ? 0.5 : 0.8 }}
          >
            {/* Time Display */}
            <motion.div
              className="mb-8"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div
                className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tighter font-mono"
                style={{ color: "var(--color-text-primary)" }}
              >
                {formattedTime}
              </div>
              <div
                className="text-base tracking-[0.2em] uppercase mt-3 flex flex-wrap items-center justify-center gap-2"
                style={{ color: "var(--color-text-muted)" }}
              >
                <span>{formattedDate}</span>
                {showLunar && lunarDate.display && (
                  <span
                    className="px-2 py-0.5 rounded-md text-sm normal-case tracking-normal"
                    style={{
                      background:
                        lunarDate.festival || lunarDate.jieQi
                          ? "rgba(251, 146, 60, 0.15)"
                          : "var(--color-bg-tertiary)",
                      color:
                        lunarDate.festival || lunarDate.jieQi
                          ? "rgb(251, 146, 60)"
                          : "var(--color-text-muted)",
                    }}
                  >
                    {lunarDate.display}
                  </span>
                )}
              </div>

              {/* 天气显示 */}
              {showWeather && weather && (
                <motion.div
                  className="mt-4 inline-flex items-center gap-3 px-4 py-2 rounded-xl"
                  style={{
                    background: "var(--color-glass)",
                    border: "1px solid var(--color-glass-border)",
                  }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  {/* 天气图标和温度 */}
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getWeatherIcon(weather.icon)}</span>
                    <span
                      className="text-xl font-medium"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {weather.temperature}°C
                    </span>
                  </div>

                  {/* 分隔线 */}
                  <div
                    className="w-px h-6"
                    style={{ background: "var(--color-glass-border)" }}
                  />

                  {/* 天气详情 */}
                  <div className="flex items-center gap-3 text-sm">
                    <span style={{ color: "var(--color-text-secondary)" }}>
                      {weather.description}
                    </span>
                    <span
                      className="flex items-center gap-1"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      <Droplets className="w-3 h-3" />
                      {weather.humidity}%
                    </span>
                    <span
                      className="hidden sm:flex items-center gap-1"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      <Wind className="w-3 h-3" />
                      {weather.windSpeed}m/s
                    </span>
                  </div>

                  {/* 城市 */}
                  <div
                    className="hidden md:flex items-center gap-1 text-xs"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    <MapPin className="w-3 h-3" />
                    {weather.city}
                  </div>

                  {/* 刷新按钮 */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      refreshWeather();
                    }}
                    className="p-1 rounded-md hover:bg-white/10 transition-colors"
                    style={{ color: "var(--color-text-muted)" }}
                    title="刷新天气"
                  >
                    <RefreshCw className={`w-3 h-3 ${weatherLoading ? 'animate-spin' : ''}`} />
                  </button>
                </motion.div>
              )}
            </motion.div>

            {/* Greeting with Typewriter */}
            <motion.h1
              className="text-base sm:text-lg lg:text-xl font-serif font-medium mb-8 tracking-wide min-h-[3.5em] flex items-center justify-center"
              style={{ color: "var(--color-text-secondary)" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              layout
            >
              {isLiteMode ? (
                // 精简模式：静态文字，无 Sparkles 特效
                <Typewriter
                  getNextWord={getRandomWisdom}
                  initialWord={greeting}
                  delayBetweenWords={5000}
                  fullSentence
                />
              ) : (
                <Sparkles>
                  <Typewriter
                    getNextWord={getRandomWisdom}
                    initialWord={greeting}
                    delayBetweenWords={5000}
                    fullSentence
                  />
                </Sparkles>
              )}
            </motion.h1>

            {/* Search Hint - 精简模式用简化搜索框 */}
            <motion.div
              className="relative inline-block"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              whileHover={{ y: isLiteMode ? 0 : -2 }}
            >
              {isLiteMode ? (
                // 精简模式：简约搜索框，无 Moving Border
                <div
                  className="inline-flex items-center gap-3 px-6 py-3.5 rounded-xl cursor-pointer transition-all duration-300 hover:shadow-md"
                  style={{
                    background: "var(--color-glass)",
                    border: "1px solid var(--color-glass-border)",
                  }}
                  onClick={() => setIsSpotlightOpen(true)}
                >
                  <Search
                    className="w-4 h-4"
                    style={{ color: "var(--color-text-muted)" }}
                  />
                  <span
                    className="tracking-wide"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    搜索或输入命令...
                  </span>
                  <kbd
                    className="px-2 py-1 rounded text-xs flex items-center gap-1 ml-2"
                    style={{
                      background: "var(--color-bg-tertiary)",
                      color: "var(--color-text-muted)",
                      border: "1px solid var(--color-border-light)",
                    }}
                  >
                    <Command className="w-3 h-3" /> K
                  </kbd>
                </div>
              ) : (
                // 完整模式：Moving Border 搜索框
                <MovingBorderButton
                  borderRadius="1rem"
                  duration={3000}
                  containerClassName="cursor-pointer"
                  borderClassName="bg-[radial-gradient(var(--color-primary)_40%,transparent_60%)]"
                  className="bg-[var(--color-glass)] dark:bg-slate-900/[0.8] border-[var(--color-glass-border)] dark:border-slate-800 px-6 py-3.5 gap-3"
                  onClick={() => setIsSpotlightOpen(true)}
                >
                  <Search
                    className="w-4 h-4 transition-colors group-hover:text-[var(--color-primary)]"
                    style={{ color: "var(--color-text-muted)" }}
                  />
                  <span
                    className="tracking-wide transition-colors"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    搜索或输入命令...
                  </span>
                  <kbd
                    className="px-2 py-1 rounded text-xs flex items-center gap-1 ml-2"
                    style={{
                      background: "var(--color-bg-tertiary)",
                      color: "var(--color-text-muted)",
                      border: "1px solid var(--color-border-light)",
                    }}
                  >
                    <Command className="w-3 h-3" /> K
                  </kbd>
                </MovingBorderButton>
              )}
            </motion.div>
          </motion.section>

          {/* Read Later Hero Card - 精简模式下简化 3D 效果 */}
          {readLaterBookmarks.length > 0 && (
            <motion.section
              className="mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              {isLiteMode ? (
                // 精简模式：普通卡片，无 3D 效果
                <div
                  className="p-8 rounded-2xl cursor-pointer transition-all duration-300 hover:shadow-lg"
                  style={{
                    background: "var(--color-glass)",
                    border: "1px solid var(--color-glass-border)",
                  }}
                  onClick={() =>
                    window.open(readLaterBookmarks[0].url, "_blank")
                  }
                >
                  <div className="flex flex-col md:flex-row gap-6">
                    {readLaterBookmarks[0].ogImage && (
                      <div className="w-full md:w-1/3 aspect-video rounded-xl overflow-hidden">
                        <img
                          src={readLaterBookmarks[0].ogImage}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-xs font-medium mb-4">
                          <BookMarked className="w-3 h-3" />
                          稍后阅读
                        </span>
                        <h2
                          className="text-2xl md:text-3xl font-serif font-medium mb-3 line-clamp-2"
                          style={{ color: "var(--color-text-primary)" }}
                        >
                          {readLaterBookmarks[0].title}
                        </h2>
                        {readLaterBookmarks[0].description && (
                          <p
                            className="line-clamp-2"
                            style={{ color: "var(--color-text-secondary)" }}
                          >
                            {readLaterBookmarks[0].description}
                          </p>
                        )}
                      </div>
                      <div className="mt-6 flex items-center justify-between">
                        <span
                          className="text-sm"
                          style={{ color: "var(--color-text-muted)" }}
                        >
                          {new URL(readLaterBookmarks[0].url).hostname}
                        </span>
                        <span
                          className="flex items-center gap-2 text-sm"
                          style={{ color: "var(--color-primary)" }}
                        >
                          开始阅读 <ExternalLink className="w-4 h-4" />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // 完整模式：3D 卡片
                <Card3D
                  className="cursor-pointer"
                  glowColor="rgba(251, 146, 60, 0.4)"
                >
                  <div
                    className="p-8 flex flex-col md:flex-row gap-6"
                    onClick={() =>
                      window.open(readLaterBookmarks[0].url, "_blank")
                    }
                  >
                    {readLaterBookmarks[0].ogImage && (
                      <CardItem
                        translateZ={30}
                        className="w-full md:w-1/3 aspect-video rounded-xl overflow-hidden"
                      >
                        <img
                          src={readLaterBookmarks[0].ogImage}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </CardItem>
                    )}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <CardItem translateZ={40}>
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-xs font-medium mb-4">
                            <BookMarked className="w-3 h-3" />
                            稍后阅读
                          </span>
                        </CardItem>
                        <CardItem translateZ={50}>
                          <h2
                            className="text-2xl md:text-3xl font-serif font-medium mb-3 line-clamp-2"
                            style={{ color: "var(--color-text-primary)" }}
                          >
                            {readLaterBookmarks[0].title}
                          </h2>
                        </CardItem>
                        {readLaterBookmarks[0].description && (
                          <CardItem translateZ={30}>
                            <p
                              className="line-clamp-2"
                              style={{ color: "var(--color-text-secondary)" }}
                            >
                              {readLaterBookmarks[0].description}
                            </p>
                          </CardItem>
                        )}
                      </div>
                      <CardItem translateZ={20} className="mt-6">
                        <div className="flex items-center justify-between">
                          <span
                            className="text-sm"
                            style={{ color: "var(--color-text-muted)" }}
                          >
                            {new URL(readLaterBookmarks[0].url).hostname}
                          </span>
                          <span
                            className="flex items-center gap-2 text-sm"
                            style={{ color: "var(--color-primary)" }}
                          >
                            开始阅读 <ExternalLink className="w-4 h-4" />
                          </span>
                        </div>
                      </CardItem>
                    </div>
                  </div>
                </Card3D>
              )}
            </motion.section>
          )}

          {/* Pinned Bookmarks - Bento Grid 非对称布局 */}
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
                  <BreathingDot
                    color="#eab308"
                    size="sm"
                    className="absolute -top-1 -right-1"
                  />
                </div>
                <h2
                  className="text-xl font-medium tracking-wide"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  常用
                </h2>
                <span
                  className="text-sm"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {pinnedBookmarks.length}
                </span>
              </div>

              <BentoGrid>
                {/* System Monitor Card - 引擎室 */}
                {widgetVisibility.systemMonitor !== false && (
                  <BentoGridItem
                    key="system-monitor"
                    colSpan={2}
                    rowSpan={2}
                    spotlightColor={
                      isLiteMode ? undefined : "rgba(6, 182, 212, 0.15)"
                    }
                    delay={0}
                  >
                    <SystemMonitorCard />
                  </BentoGridItem>
                )}

                {/* Hardware Specs Card - JARVIS 蓝图 */}
                {widgetVisibility.hardwareIdentity !== false && (
                  <BentoGridItem
                    key="hardware-specs"
                    colSpan={2}
                    rowSpan={2}
                    spotlightColor={
                      isLiteMode ? undefined : "rgba(6, 182, 212, 0.1)"
                    }
                    delay={0.1}
                  >
                    <HardwareIdentityCard />
                  </BentoGridItem>
                )}

                {/* Vital Signs Card - 生命体征 */}
                {widgetVisibility.vitalSigns !== false && (
                  <BentoGridItem
                    key="vital-signs"
                    colSpan={2}
                    rowSpan={2}
                    spotlightColor={
                      isLiteMode ? undefined : "rgba(6, 182, 212, 0.12)"
                    }
                    delay={0.15}
                  >
                    <VitalSignsCard />
                  </BentoGridItem>
                )}

                {/* Network Telemetry Card - 网络遥测 */}
                {widgetVisibility.networkTelemetry !== false && (
                  <BentoGridItem
                    key="network-telemetry"
                    colSpan={2}
                    rowSpan={2}
                    spotlightColor={
                      isLiteMode ? undefined : "rgba(168, 85, 247, 0.12)"
                    }
                    delay={0.2}
                  >
                    <NetworkTelemetryCard />
                  </BentoGridItem>
                )}

                {/* Process Matrix Card - 进程矩阵 */}
                {widgetVisibility.processMatrix !== false && (
                  <BentoGridItem
                    key="process-matrix"
                    colSpan={2}
                    rowSpan={2}
                    spotlightColor={
                      isLiteMode ? undefined : "rgba(34, 197, 94, 0.12)"
                    }
                    delay={0.25}
                  >
                    <ProcessMatrixCard />
                  </BentoGridItem>
                )}

                {pinnedBookmarks.slice(0, 4).map((bookmark, index) => {
                  // 非对称布局：其余卡片 1 列
                  const colSpan = 1;
                  const rowSpan = 1;

                  return (
                    <BentoGridItem
                      key={bookmark.id}
                      colSpan={colSpan as 1 | 2}
                      rowSpan={rowSpan as 1 | 2}
                      spotlightColor={
                        isLiteMode ? undefined : "rgba(234, 179, 8, 0.15)"
                      }
                      onClick={() => window.open(bookmark.url, "_blank")}
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
                  );
                })}
              </BentoGrid>
            </motion.section>
          ) : (
            /* 独立显示系统监控卡片（当没有 pinned bookmarks 时） */
            <motion.section
              className="mb-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              <BentoGrid>
                {widgetVisibility.systemMonitor !== false && (
                  <BentoGridItem
                    key="system-monitor-standalone"
                    colSpan={2}
                    rowSpan={2}
                    spotlightColor={
                      isLiteMode ? undefined : "rgba(6, 182, 212, 0.15)"
                    }
                    delay={0}
                  >
                    <SystemMonitorCard />
                  </BentoGridItem>
                )}
                {widgetVisibility.hardwareIdentity !== false && (
                  <BentoGridItem
                    key="hardware-specs-standalone"
                    colSpan={2}
                    rowSpan={2}
                    spotlightColor={
                      isLiteMode ? undefined : "rgba(6, 182, 212, 0.1)"
                    }
                    delay={0.1}
                  >
                    <HardwareIdentityCard />
                  </BentoGridItem>
                )}
                {widgetVisibility.vitalSigns !== false && (
                  <BentoGridItem
                    key="vital-signs-standalone"
                    colSpan={2}
                    rowSpan={2}
                    spotlightColor={
                      isLiteMode ? undefined : "rgba(6, 182, 212, 0.12)"
                    }
                    delay={0.15}
                  >
                    <VitalSignsCard />
                  </BentoGridItem>
                )}
                {widgetVisibility.networkTelemetry !== false && (
                  <BentoGridItem
                    key="network-telemetry-standalone"
                    colSpan={2}
                    rowSpan={2}
                    spotlightColor={
                      isLiteMode ? undefined : "rgba(168, 85, 247, 0.12)"
                    }
                    delay={0.2}
                  >
                    <NetworkTelemetryCard />
                  </BentoGridItem>
                )}
                {widgetVisibility.processMatrix !== false && (
                  <BentoGridItem
                    key="process-matrix-standalone"
                    colSpan={2}
                    rowSpan={2}
                    spotlightColor={
                      isLiteMode ? undefined : "rgba(34, 197, 94, 0.12)"
                    }
                    delay={0.25}
                  >
                    <ProcessMatrixCard />
                  </BentoGridItem>
                )}
              </BentoGrid>
            </motion.section>
          )}

          {/* Category Sections */}
          {categories.map((category, catIndex) => {
            const categoryBookmarks = bookmarksByCategory[category.id] || [];
            if (categoryBookmarks.length === 0) return null;

            return (
              <motion.section
                key={category.id}
                className="mb-12 relative"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 + catIndex * 0.1 }}
                data-category-id={category.id}
              >
                {/* 背景装饰文字 - 精简模式下隐藏 */}
                {!isLiteMode && (
                  <div
                    className="absolute -top-8 left-0 text-[120px] font-bold pointer-events-none select-none leading-none"
                    style={{
                      fontFamily: "Inter, sans-serif",
                      color: "var(--color-text-muted)",
                      opacity: 0.03,
                    }}
                  >
                    {category.name}
                  </div>
                )}

                <div className="flex items-center gap-3 mb-6 relative z-10">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center backdrop-blur-sm"
                    style={{
                      backgroundColor: `${category.color}15`,
                      color: category.color,
                    }}
                  >
                    {(() => {
                      const IconComp = getIconComponent(category.icon);
                      return <IconComp className="w-4 h-4" />;
                    })()}
                  </div>
                  <h2
                    className="text-xl font-medium tracking-wide"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {category.name}
                  </h2>
                  <span
                    className="text-sm"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {categoryBookmarks.length}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 relative z-10">
                  {categoryBookmarks.map((bookmark, index) => (
                    <motion.div
                      key={bookmark.id}
                      initial={{ opacity: 0, y: isLiteMode ? 10 : 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <SpotlightCard
                        className="h-full cursor-pointer"
                        spotlightColor={
                          isLiteMode ? "transparent" : `${category.color}20`
                        }
                        onClick={() => window.open(bookmark.url, "_blank")}
                        onContextMenu={(e) => handleContextMenu(e, bookmark)}
                      >
                        <div className="flex flex-col h-full">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                            style={{ background: "var(--color-bg-tertiary)" }}
                          >
                            {bookmark.iconUrl ? (
                              <img
                                src={bookmark.iconUrl}
                                alt=""
                                className="w-5 h-5 object-contain"
                              />
                            ) : bookmark.icon ? (
                              (() => {
                                const IconComp = getIconComponent(
                                  bookmark.icon
                                );
                                return (
                                  <IconComp
                                    className="w-5 h-5"
                                    style={{ color: "var(--color-primary)" }}
                                  />
                                );
                              })()
                            ) : bookmark.favicon ? (
                              <img
                                src={bookmark.favicon}
                                alt=""
                                className="w-5 h-5"
                              />
                            ) : (
                              <ExternalLink
                                className="w-5 h-5"
                                style={{ color: "var(--color-text-muted)" }}
                              />
                            )}
                          </div>

                          <h3
                            className="font-medium line-clamp-1 mb-1"
                            style={{ color: "var(--color-text-primary)" }}
                          >
                            {bookmark.title}
                          </h3>
                          <p
                            className="text-sm line-clamp-2 flex-1"
                            style={{ color: "var(--color-text-muted)" }}
                          >
                            {bookmark.description ||
                              new URL(bookmark.url).hostname}
                          </p>
                        </div>
                      </SpotlightCard>
                    </motion.div>
                  ))}
                </div>
              </motion.section>
            );
          })}

          {/* Empty State */}
          {bookmarks.length === 0 && !isLoading && (
            <motion.div
              className="text-center py-20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-nebula-purple/20 to-nebula-pink/20 flex items-center justify-center">
                {isLiteMode ? (
                  <BookmarkIcon
                    className="w-10 h-10"
                    style={{ color: "var(--color-text-muted)" }}
                  />
                ) : (
                  <Sparkles>
                    <BookmarkIcon
                      className="w-10 h-10"
                      style={{ color: "var(--color-text-muted)" }}
                    />
                  </Sparkles>
                )}
              </div>
              <h3
                className="text-2xl font-serif mb-4"
                style={{ color: "var(--color-text-primary)" }}
              >
                开启你的星云之旅
              </h3>
              <p
                className="mb-8 max-w-md mx-auto"
                style={{ color: "var(--color-text-secondary)" }}
              >
                按{" "}
                <kbd
                  className="px-2 py-1 rounded text-xs"
                  style={{ background: "var(--color-bg-tertiary)" }}
                >
                  ⌘K
                </kbd>{" "}
                打开命令面板， 粘贴链接即可添加第一个书签
              </p>
              <motion.button
                onClick={() => setIsAddModalOpen(true)}
                className="px-8 py-4 rounded-2xl bg-gradient-to-r from-nebula-purple to-nebula-pink text-white font-medium shadow-glow-md"
                whileHover={{ scale: isLiteMode ? 1.02 : 1.05 }}
                whileTap={{ scale: isLiteMode ? 0.98 : 0.95 }}
              >
                添加第一个书签
              </motion.button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Floating Dock - 桌面端 */}
      <div className="hidden md:flex fixed bottom-6 left-1/2 -translate-x-1/2 items-end gap-4 z-50">
        {/* 迷你监控 Widget - 桌面端 Dock 左侧 */}
        {widgetVisibility.dockMiniMonitor !== false && (
          <SystemMonitor variant="mini" size="sm" showLoading={false} />
        )}

        <FloatingDock
          items={dockItems.map((item) => ({
            ...item,
            onClick: item.href ? undefined : (item.onClick || (() => handleDockClick(item.id))),
          }))}
        />
      </div>

      {/* Mobile Floating Dock - 移动端可展开悬浮坞 */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex flex-col">
        {/* Ticker 状态栏 - 移动端 Dock 上方 */}
        {widgetVisibility.mobileTicker !== false && (
          <SystemMonitor variant="ticker" compact showLoading={false} />
        )}

        <MobileFloatingDock
          items={dockItems
            .filter((item) => !item.href) // 过滤掉外链项（移动端不需要 GitHub 链接）
            .map((item) => ({
              id: item.id,
              label: item.title,
              icon: item.IconComponent,
              onClick: item.onClick || (() => handleDockClick(item.id)),
              isActive: item.id === "home", // 首页默认激活
            }))}
        />
      </div>

      {/* Spotlight Search */}
      <SpotlightSearch
        isOpen={isSpotlightOpen}
        onClose={() => setIsSpotlightOpen(false)}
        bookmarks={bookmarks}
        onAddBookmark={handleAddFromSpotlight}
      />

      {/* Add Bookmark Modal */}
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
      />

      {/* Icon Manager */}
      <IconManager
        isOpen={isIconManagerOpen}
        onClose={() => setIsIconManagerOpen(false)}
        customIcons={customIcons}
        onAddIcon={addCustomIcon}
        onDeleteIcon={deleteCustomIcon}
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

      {/* 回到顶部按钮 */}
      <ScrollToTop threshold={400} />
    </BackgroundWrapper>
  );
}

export default App;
