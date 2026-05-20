import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pin, ChevronRight, ChevronLeft, LayoutList, Minimize2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { IconRenderer } from "../IconRenderer";
import { useQuickNotesContext } from "../../hooks/QuickNotesContext";
import { useCloudDrawer } from "../../hooks/CloudDrawerContext";

interface NavItem {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  count: number;
  /** 节点类型：分类（默认锚点跳转） / 模块（点击触发外部回调，如打开抽屉） */
  kind?: "category" | "module";
  /** 模块项专用：右上角小红点徽标（如未同步数 / 冲突数） */
  badge?: { value: number; tone?: "warn" | "danger" | "info" } | null;
  /** 模块项专用：点击行为；提供则覆盖默认的滚动锚点逻辑 */
  onClick?: () => void;
}

interface SidebarNavProps {
  items: NavItem[];
  pinnedCount?: number;
  className?: string;
}

// 视图模式：球形 / 折叠（仅图标列） / 展开（图标+名称+数量）
type ViewMode = "orb" | "collapsed" | "expanded";
const SIDEBAR_VIEW_MODE_KEY = "sidebar-nav-view-mode";

function loadViewMode(): ViewMode {
  try {
    const v = localStorage.getItem(SIDEBAR_VIEW_MODE_KEY);
    if (v === "orb" || v === "collapsed" || v === "expanded") return v;
  } catch {
    /* */
  }
  // 默认球形，避免遮挡书签
  return "orb";
}

export function SidebarNav({ items, pinnedCount = 0, className = "" }: SidebarNavProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(loadViewMode);
  const [isVisible, setIsVisible] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const { t } = useTranslation();

  const isCollapsed = viewMode === "collapsed";
  const isOrb = viewMode === "orb";

  // 持久化视图模式
  const updateViewMode = useCallback((next: ViewMode) => {
    setViewMode(next);
    try {
      localStorage.setItem(SIDEBAR_VIEW_MODE_KEY, next);
    } catch {
      /* */
    }
  }, []);

  // 主题监听（球形态下用于光晕颜色）
  useEffect(() => {
    const update = () => setIsDark(document.documentElement.classList.contains("dark"));
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  // 检测页面滚动高度，决定是否显示侧边栏
  useEffect(() => {
    const checkVisibility = () => {
      // 当页面内容足够长时显示侧边栏（至少滚动 300px 或页面高度大于 1.5 倍视口高度）
      const pageHeight = document.documentElement.scrollHeight;
      const viewportHeight = window.innerHeight;
      const hasEnoughContent = pageHeight > viewportHeight * 1.5;
      // 如果存在模块项（如灵感云），即使分类为空也允许显示
      const hasModule = items.some((it) => it.kind === "module");
      setIsVisible((hasEnoughContent && items.length > 0) || hasModule);
    };

    checkVisibility();
    window.addEventListener("resize", checkVisibility);
    
    // 使用 MutationObserver 监听 DOM 变化
    const observer = new MutationObserver(checkVisibility);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener("resize", checkVisibility);
      observer.disconnect();
    };
  }, [items]);

  // 监听滚动，高亮当前可见的分类
  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll("[data-category-id]");
      const pinnedSection = document.querySelector("[data-section='pinned']");
      
      let currentId: string | null = null;
      const scrollTop = window.scrollY + 200; // 偏移量，提前触发

      // 检查置顶区域
      if (pinnedSection) {
        const rect = pinnedSection.getBoundingClientRect();
        const top = rect.top + window.scrollY;
        if (scrollTop >= top && scrollTop < top + rect.height) {
          currentId = "pinned";
        }
      }

      // 检查各分类区域
      sections.forEach((section) => {
        const rect = section.getBoundingClientRect();
        const top = rect.top + window.scrollY;
        if (scrollTop >= top && scrollTop < top + rect.height) {
          currentId = section.getAttribute("data-category-id");
        }
      });

      setActiveId(currentId);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 点击导航项，分类项滚动 / 模块项触发回调
  const handleItemClick = useCallback((item: NavItem) => {
    if (item.kind === "module") {
      item.onClick?.();
      return;
    }
    const id = item.id;
    const section = id === "pinned" 
      ? document.querySelector("[data-section='pinned']")
      : document.querySelector(`[data-category-id="${id}"]`);
    
    if (section) {
      const top = section.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top, behavior: "smooth" });
    }
  }, []);

  // 灵感速记 Context（可选：未在 Provider 中则返回 null）
  const notesCtx = useQuickNotesContext();
  const cloudDrawer = useCloudDrawer();

  // 灵感云模块项（仅在有 Provider 注入时追加）
  const cloudModuleItem: NavItem | null = useMemo(() => {
    if (!notesCtx) return null;
    const notes = notesCtx.notes;
    let local = 0;
    let conflict = 0;
    notes.forEach((n) => {
      if (n.syncStatus === 'conflict') conflict++;
      else if (n.syncStatus !== 'synced' && n.syncStatus !== 'syncing') local++;
    });
    // 徽标优先显示冲突（橙），其次未同步（黄），都没就不显示徽标
    const badge = conflict > 0
      ? { value: conflict, tone: 'danger' as const }
      : local > 0
        ? { value: local, tone: 'warn' as const }
        : null;
    return {
      id: '__module__cloud',
      name: t('quickNotes.cloud.navName', { defaultValue: '灵感云' }),
      icon: 'Cloud',
      color: '#22c55e',
      count: notes.length,
      kind: 'module' as const,
      badge,
      onClick: () => cloudDrawer.open(),
    };
  }, [notesCtx, cloudDrawer, t]);

  const allItems: NavItem[] = useMemo(() => {
    // 分离分类项与模块项：模块项始终位于列表末尾
    const categoryItems = items.filter((it) => it.kind !== "module");
    const incomingModules = items.filter((it) => it.kind === "module");
    const head: NavItem[] = pinnedCount > 0
      ? [{ id: "pinned", name: t('sidebar.pinned'), icon: "Pin", color: "#eab308", count: pinnedCount, kind: "category" }]
      : [];
    const builtinModules: NavItem[] = cloudModuleItem ? [cloudModuleItem] : [];
    return [...head, ...categoryItems, ...incomingModules, ...builtinModules];
  }, [items, pinnedCount, t, cloudModuleItem]);

  // 球形态徽标只反映分类总数（不含模块项），保持原有语义
  const totalCount = useMemo(
    () => allItems.filter((it) => it.kind !== "module").reduce((sum, it) => sum + (it.count || 0), 0),
    [allItems]
  );

  if (!isVisible) return null;

  return (
    <motion.div
      className={`fixed left-4 top-1/2 -translate-y-1/2 z-40 hidden lg:block ${className}`}
      style={{ maxHeight: "calc(100vh - 2rem)" }}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <AnimatePresence mode="wait">
        {isOrb ? (
          /* ========== 球形态：悬浮小球，避免遮挡书签 ========== */
          <motion.button
            key="orb"
            type="button"
            onClick={() => updateViewMode("expanded")}
            title={t('sidebar.expand')}
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.3, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="relative w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-xl cursor-pointer"
            style={{
              background: "var(--color-glass)",
              border: "1px solid var(--color-glass-border)",
              boxShadow: isDark
                ? "0 0 20px rgba(34, 211, 238, 0.15), 0 4px 20px rgba(0,0,0,0.4)"
                : "0 0 20px rgba(59, 130, 246, 0.1), 0 4px 20px rgba(0,0,0,0.1)",
              color: "var(--color-text-secondary)",
              willChange: "transform, opacity",
            }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
          >
            <LayoutList
              className="w-5 h-5"
              style={{ color: isDark ? "rgba(34, 211, 238, 0.85)" : "rgb(59, 130, 246)" }}
            />
            {/* 数量徽标 */}
            {totalCount > 0 && (
              <span
                className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-semibold flex items-center justify-center"
                style={{
                  background: isDark ? "rgb(34, 211, 238)" : "rgb(59, 130, 246)",
                  color: "#fff",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                }}
              >
                {totalCount > 99 ? "99+" : totalCount}
              </span>
            )}
            {/* 呼吸光晕 */}
            <motion.div
              className="absolute inset-0 rounded-full pointer-events-none"
              animate={{
                boxShadow: isDark
                  ? [
                      "0 0 8px rgba(34, 211, 238, 0.2)",
                      "0 0 16px rgba(34, 211, 238, 0.35)",
                      "0 0 8px rgba(34, 211, 238, 0.2)",
                    ]
                  : [
                      "0 0 8px rgba(59, 130, 246, 0.15)",
                      "0 0 16px rgba(59, 130, 246, 0.25)",
                      "0 0 8px rgba(59, 130, 246, 0.15)",
                    ],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.button>
        ) : (
          /* ========== 列表态（折叠/展开） ========== */
          <motion.div
            key="list"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
          >
            {/* 外层容器 - 不使用 overflow-hidden，让按钮可以超出；限制高度以保证垂直居中不溢出 */}
            <div className="relative flex flex-col" style={{ maxHeight: "calc(100vh - 2rem)" }}>
              {/* 折叠/展开按钮（折叠到图标列 / 展开为完整列表） */}
              <button
                onClick={() => updateViewMode(isCollapsed ? "expanded" : "collapsed")}
                className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center transition-all hover:scale-110 z-10"
                style={{
                  background: "var(--color-bg-secondary)",
                  border: "1px solid var(--color-border-light)",
                  color: "var(--color-text-muted)",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
                }}
                title={isCollapsed ? t('sidebar.expand') : ""}
              >
                {isCollapsed ? (
                  <ChevronRight className="w-3 h-3" />
                ) : (
                  <ChevronLeft className="w-3 h-3" />
                )}
              </button>

              {/* 收为球按钮 - 仅展开态显示 */}
              {!isCollapsed && (
                <button
                  onClick={() => updateViewMode("orb")}
                  className="absolute -right-3 -top-3 w-6 h-6 rounded-full flex items-center justify-center transition-all hover:scale-110 z-10"
                  style={{
                    background: "var(--color-bg-secondary)",
                    border: "1px solid var(--color-border-light)",
                    color: "var(--color-text-muted)",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
                  }}
                  title={t('sidebar.collapse_to_orb')}
                >
                  <Minimize2 className="w-3 h-3" />
                </button>
              )}

              {/* 内层容器 - 带圆角和毛玻璃效果 */}
              <motion.div
                className="rounded-2xl backdrop-blur-xl overflow-hidden flex flex-col"
                style={{
                  background: "var(--color-glass)",
                  border: "1px solid var(--color-glass-border)",
                  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
                  maxHeight: "calc(100vh - 2rem)",
                }}
                animate={{ width: isCollapsed ? 56 : 168 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
              >
                <nav className="py-3 overflow-y-auto overflow-x-hidden flex-1 scrollbar-thin">
                  <ul className="space-y-1 px-2">
                    {allItems.map((item, index) => {
                      const isActive = activeId === item.id;
                      const isPinned = item.id === "pinned";
                      const isModule = item.kind === "module";
                      // 找到第一个模块项的索引，用于在它之前画分隔线
                      const firstModuleIndex = allItems.findIndex((it) => it.kind === "module");
                      const showDivider = isModule && index === firstModuleIndex && firstModuleIndex > 0;

                      return (
                        <React.Fragment key={item.id}>
                          {showDivider && (
                            <li
                              aria-hidden
                              className="my-1.5 mx-2 h-px"
                              style={{ background: "var(--color-border-light)" }}
                            />
                          )}
                          <motion.li
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                          >
                          <button
                            onClick={() => handleItemClick(item)}
                            className="w-full flex items-center gap-2 px-2 py-2 rounded-lg transition-all duration-200 relative"
                            style={{
                              background: isActive
                                ? `${item.color || "var(--color-primary)"}15`
                                : "transparent",
                              color: isActive
                                ? item.color || "var(--color-primary)"
                                : "var(--color-text-secondary)",
                            }}
                            title={item.name}
                          >
                            {/* 激活指示器（模块项不显示锚点高亮） */}
                            {!isModule && (
                              <div
                                className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full transition-all duration-200"
                                style={{
                                  background: isActive ? item.color || "var(--color-primary)" : "transparent",
                                  opacity: isActive ? 1 : 0,
                                }}
                              />
                            )}

                            {/* 图标 */}
                            <div
                              className="relative w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors"
                              style={{
                                background: isActive
                                  ? `${item.color || "var(--color-primary)"}20`
                                  : "var(--color-bg-tertiary)",
                              }}
                            >
                              {isPinned ? (
                                <Pin
                                  className="w-4 h-4 transition-colors"
                                  style={{
                                    color: isActive
                                      ? item.color || "var(--color-primary)"
                                      : "var(--color-text-muted)",
                                  }}
                                />
                              ) : (
                                <IconRenderer
                                  icon={item.icon || "folder"}
                                  className="w-4 h-4 transition-colors"
                                  style={{
                                    color: isActive
                                      ? item.color || "var(--color-primary)"
                                      : "var(--color-text-muted)",
                                  }}
                                />
                              )}
                              {/* 模块项右上角红点徽标（折叠态可见） */}
                              {isModule && item.badge && item.badge.value > 0 && (
                                <span
                                  className="absolute -top-1 -right-1 min-w-[14px] h-[14px] px-1 rounded-full text-[9px] font-semibold flex items-center justify-center"
                                  style={{
                                    background:
                                      item.badge.tone === "danger"
                                        ? "#f97316"
                                        : item.badge.tone === "info"
                                        ? "#3b82f6"
                                        : "#eab308",
                                    color: "#fff",
                                    boxShadow: "0 0 0 2px var(--color-bg-secondary, rgba(0,0,0,0.2))",
                                  }}
                                >
                                  {item.badge.value > 99 ? "99+" : item.badge.value}
                                </span>
                              )}
                            </div>

                            {/* 名称和数量 - 折叠时隐藏 */}
                            {!isCollapsed && (
                              <motion.div
                                className="flex items-center justify-between flex-1 min-w-0 overflow-hidden"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.15, delay: 0.1 }}
                              >
                                <span className="text-sm font-medium truncate">
                                  {item.name}
                                </span>
                                {isModule ? (
                                  item.badge && item.badge.value > 0 ? (
                                    <span
                                      className="text-[10px] px-1.5 py-0.5 rounded-full ml-1 flex-shrink-0 font-semibold"
                                      style={{
                                        background:
                                          item.badge.tone === "danger"
                                            ? "rgba(249,115,22,0.18)"
                                            : item.badge.tone === "info"
                                            ? "rgba(59,130,246,0.18)"
                                            : "rgba(234,179,8,0.18)",
                                        color:
                                          item.badge.tone === "danger"
                                            ? "#f97316"
                                            : item.badge.tone === "info"
                                            ? "#3b82f6"
                                            : "#eab308",
                                      }}
                                    >
                                      {item.badge.value > 99 ? "99+" : item.badge.value}
                                    </span>
                                  ) : (
                                    <span
                                      className="text-[10px] px-1.5 py-0.5 rounded-full ml-1 flex-shrink-0"
                                      style={{
                                        background: "var(--color-bg-tertiary)",
                                        color: "var(--color-text-muted)",
                                        opacity: 0.7,
                                      }}
                                    >
                                      {item.count}
                                    </span>
                                  )
                                ) : (
                                  <span
                                    className="text-xs px-1.5 py-0.5 rounded-full ml-1 flex-shrink-0"
                                    style={{
                                      background: "var(--color-bg-tertiary)",
                                      color: "var(--color-text-muted)",
                                    }}
                                  >
                                    {item.count}
                                  </span>
                                )}
                              </motion.div>
                            )}
                          </button>
                          </motion.li>
                        </React.Fragment>
                      );
                    })}
                  </ul>
                </nav>

                {/* 底部提示 - 折叠时隐藏（位于滚动区域之外，始终可见） */}
                {!isCollapsed && (
                  <motion.div
                    className="px-4 py-2 text-xs border-t flex-shrink-0"
                    style={{
                      borderColor: "var(--color-border-light)",
                      color: "var(--color-text-muted)",
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.15, delay: 0.1 }}
                  >
                    {t('sidebar.click_to_navigate')}
                  </motion.div>
                )}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
