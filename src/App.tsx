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
import { AddBookmarkModal } from "./components/AddBookmarkModal";
import { BookmarkCardContent } from "./components/BookmarkCardContent";
import { ContextMenu, useBookmarkContextMenu } from "./components/ContextMenu";
import { IconManager } from "./components/IconManager";
import { Admin } from "./pages/Admin";
import { AdminLogin } from "./components/AdminLogin";
import { ForcePasswordChange } from "./components/ForcePasswordChange";
import { useBookmarkStore } from "./hooks/useBookmarkStore";
import { useTheme } from "./hooks/useTheme";
import { useTime } from "./hooks/useTime";
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

// Dock 导航项
const dockItems = [
  { id: "home", title: "首页", icon: <Home className="w-5 h-5" />, IconComponent: Home },
  { id: "search", title: "搜索", icon: <Search className="w-5 h-5" />, IconComponent: Search },
  { id: "add", title: "添加", icon: <Plus className="w-5 h-5" />, IconComponent: Plus },
  { id: "admin", title: "管理", icon: <LayoutDashboard className="w-5 h-5" />, IconComponent: LayoutDashboard },
  {
    id: "github",
    title: "GitHub",
    icon: <Github className="w-5 h-5" />,
    IconComponent: Github,
    href: "https://github.com/cropflre/NOWEN",
  },
];

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
  });

  // 右键菜单状态
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
    bookmark: Bookmark | null;
  }>({ isOpen: false, position: { x: 0, y: 0 }, bookmark: null });

  const { getMenuItems } = useBookmarkContextMenu();

  const { greeting, formattedTime, formattedDate } = useTime();

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

  const { isDark } = useTheme();

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
      .catch(console.error);

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

  return (
    <AuroraBackground showBeams={siteSettings.enableBeamAnimation !== false}>
      {/* Meteors Effect */}
      <Meteors number={15} />

      {/* Main Content */}
      <div className="min-h-screen px-4 sm:px-6 lg:px-8 pb-32">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <motion.section
            className="pt-20 pb-16 text-center relative"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Time Display */}
            <motion.div
              className="mb-8"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div
                className="text-7xl sm:text-8xl lg:text-9xl font-semibold tracking-tighter font-mono"
                style={{ color: "var(--color-text-primary)" }}
              >
                {formattedTime}
              </div>
              <div
                className="text-base tracking-[0.2em] uppercase mt-3"
                style={{ color: "var(--color-text-muted)" }}
              >
                {formattedDate}
              </div>
            </motion.div>

            {/* Greeting with Typewriter */}
            <motion.h1
              className="text-xl sm:text-2xl lg:text-3xl font-serif font-medium mb-8 tracking-wide"
              style={{ color: "var(--color-text-secondary)" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Sparkles>
                <Typewriter
                  getNextWord={getRandomWisdom}
                  initialWord={greeting}
                  delayBetweenWords={5000}
                  fullSentence
                />
              </Sparkles>
            </motion.h1>

            {/* Search Hint - Moving Border 搜索框 */}
            <motion.div
              className="relative inline-block"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              whileHover={{ y: -2 }}
            >
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
            </motion.div>
          </motion.section>

          {/* Read Later Hero Card */}
          {readLaterBookmarks.length > 0 && (
            <motion.section
              className="mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
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
                  {/* Image */}
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

                  {/* Content */}
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
            </motion.section>
          )}

          {/* Pinned Bookmarks - Bento Grid 非对称布局 */}
          {pinnedBookmarks.length > 0 && (
            <motion.section
              className="mb-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
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
                {pinnedBookmarks.slice(0, 6).map((bookmark, index) => {
                  // 非对称布局：第一个占 2 列 2 行，其他 1 列
                  const colSpan = index === 0 ? 2 : 1;
                  const rowSpan = index === 0 ? 2 : 1;

                  return (
                    <BentoGridItem
                      key={bookmark.id}
                      colSpan={colSpan as 1 | 2}
                      rowSpan={rowSpan as 1 | 2}
                      spotlightColor="rgba(234, 179, 8, 0.15)"
                      onClick={() => window.open(bookmark.url, "_blank")}
                      onContextMenu={(e) => handleContextMenu(e, bookmark)}
                      delay={index * 0.05}
                    >
                      <BookmarkCardContent
                        bookmark={bookmark}
                        isLarge={index === 0}
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
              >
                {/* 背景装饰文字 */}
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
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <SpotlightCard
                        className="h-full cursor-pointer"
                        spotlightColor={`${category.color}20`}
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
                <Sparkles>
                  <BookmarkIcon
                    className="w-10 h-10"
                    style={{ color: "var(--color-text-muted)" }}
                  />
                </Sparkles>
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
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                添加第一个书签
              </motion.button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Floating Dock - 桌面端 */}
      <FloatingDock
        className="hidden md:flex"
        items={dockItems.map((item) => ({
          ...item,
          onClick: item.href ? undefined : () => handleDockClick(item.id),
        }))}
      />

      {/* Mobile Floating Dock - 移动端可展开悬浮坞 */}
      <MobileFloatingDock
        className="md:hidden"
        items={dockItems
          .filter((item) => !item.href) // 过滤掉外链项（移动端不需要 GitHub 链接）
          .map((item) => ({
            id: item.id,
            label: item.title,
            icon: item.IconComponent,
            onClick: () => handleDockClick(item.id),
            isActive: item.id === "home", // 首页默认激活
          }))}
      />

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
    </AuroraBackground>
  );
}

export default App;
