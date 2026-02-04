import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pin, ChevronRight, ChevronLeft } from "lucide-react";
import { getIconComponent } from "../../lib/utils";

interface NavItem {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  count: number;
}

interface SidebarNavProps {
  items: NavItem[];
  pinnedCount?: number;
  className?: string;
}

export function SidebarNav({ items, pinnedCount = 0, className = "" }: SidebarNavProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // 检测页面滚动高度，决定是否显示侧边栏
  useEffect(() => {
    const checkVisibility = () => {
      // 当页面内容足够长时显示侧边栏（至少滚动 300px 或页面高度大于 1.5 倍视口高度）
      const pageHeight = document.documentElement.scrollHeight;
      const viewportHeight = window.innerHeight;
      const hasEnoughContent = pageHeight > viewportHeight * 1.5;
      setIsVisible(hasEnoughContent && items.length > 0);
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

  // 点击导航项，滚动到对应分类
  const scrollToSection = useCallback((id: string) => {
    const section = id === "pinned" 
      ? document.querySelector("[data-section='pinned']")
      : document.querySelector(`[data-category-id="${id}"]`);
    
    if (section) {
      const top = section.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top, behavior: "smooth" });
    }
  }, []);

  if (!isVisible) return null;

  const allItems: NavItem[] = pinnedCount > 0 
    ? [{ id: "pinned", name: "常用", icon: "Pin", color: "#eab308", count: pinnedCount }, ...items]
    : items;

  return (
    <AnimatePresence>
      <motion.div
        className={`fixed left-4 top-1/2 -translate-y-1/2 z-40 hidden lg:block ${className}`}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
      >
        <div
          className="relative rounded-2xl backdrop-blur-xl overflow-hidden"
          style={{
            background: "var(--color-glass)",
            border: "1px solid var(--color-glass-border)",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
          }}
        >
          {/* 折叠/展开按钮 */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center transition-all hover:scale-110"
            style={{
              background: "var(--color-bg-secondary)",
              border: "1px solid var(--color-border-light)",
              color: "var(--color-text-muted)",
            }}
          >
            {isCollapsed ? (
              <ChevronRight className="w-3 h-3" />
            ) : (
              <ChevronLeft className="w-3 h-3" />
            )}
          </button>

          <motion.nav
            className="py-3"
            animate={{ width: isCollapsed ? 48 : 160 }}
            transition={{ duration: 0.2 }}
          >
            <ul className="space-y-1 px-2">
              {allItems.map((item, index) => {
                const isActive = activeId === item.id;
                const IconComp = item.id === "pinned" ? Pin : getIconComponent(item.icon || "Folder");
                
                return (
                  <motion.li
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <button
                      onClick={() => scrollToSection(item.id)}
                      className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg transition-all duration-200 group ${
                        isActive ? "scale-[1.02]" : "hover:scale-[1.01]"
                      }`}
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
                      {/* 激活指示器 */}
                      <div
                        className="absolute left-0 w-1 h-6 rounded-r-full transition-all duration-200"
                        style={{
                          background: isActive ? item.color || "var(--color-primary)" : "transparent",
                          opacity: isActive ? 1 : 0,
                        }}
                      />

                      {/* 图标 */}
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors"
                        style={{
                          background: isActive 
                            ? `${item.color || "var(--color-primary)"}20`
                            : "var(--color-bg-tertiary)",
                        }}
                      >
                        <IconComp 
                          className="w-4 h-4 transition-colors"
                          style={{ 
                            color: isActive 
                              ? item.color || "var(--color-primary)"
                              : "var(--color-text-muted)"
                          }}
                        />
                      </div>

                      {/* 名称和数量 - 折叠时隐藏 */}
                      <AnimatePresence>
                        {!isCollapsed && (
                          <motion.div
                            className="flex items-center justify-between flex-1 min-w-0"
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: "auto" }}
                            exit={{ opacity: 0, width: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <span className="text-sm font-medium truncate">
                              {item.name}
                            </span>
                            <span
                              className="text-xs px-1.5 py-0.5 rounded-full ml-1"
                              style={{
                                background: "var(--color-bg-tertiary)",
                                color: "var(--color-text-muted)",
                              }}
                            >
                              {item.count}
                            </span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </button>
                  </motion.li>
                );
              })}
            </ul>
          </motion.nav>

          {/* 底部提示 - 折叠时隐藏 */}
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                className="px-4 py-2 text-xs border-t"
                style={{
                  borderColor: "var(--color-border-light)",
                  color: "var(--color-text-muted)",
                }}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                点击快速定位
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
