/**
 * Mobile Floating Dock - 移动端底部导航栏
 * 固定在屏幕最底部，不支持拖拽
 * 花瓣式展开菜单，支持日间/夜间模式
 * 支持左侧插入自定义内容（如状态栏）
 */
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { cn } from "../../lib/utils";

interface DockItem {
  id: string;
  label: string;
  icon: React.ComponentType<{
    className?: string;
    style?: React.CSSProperties;
  }>;
  onClick: () => void;
  isActive?: boolean;
}

interface MobileFloatingDockProps {
  items: DockItem[];
  className?: string;
  /** 左侧插槽，用于放置状态栏等 */
  leftSlot?: React.ReactNode;
}

// 液态动画配置
const LIQUID_SPRING = {
  expand: { type: "spring" as const, stiffness: 300, damping: 25 },
  item: { type: "spring" as const, stiffness: 400, damping: 28 },
  backdrop: { duration: 0.3 },
};

export function MobileFloatingDock({
  items,
  className,
  leftSlot,
}: MobileFloatingDockProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const orbBtnRef = useRef<HTMLButtonElement>(null);
  const [orbRect, setOrbRect] = useState<{ right: number; bottom: number }>({
    right: 16,
    bottom: 60,
  });

  // 展开时测量能量球位置，菜单将定位到该位置上方
  useEffect(() => {
    if (isExpanded && orbBtnRef.current) {
      const rect = orbBtnRef.current.getBoundingClientRect();
      setOrbRect({
        right: window.innerWidth - rect.right,
        bottom: window.innerHeight - rect.top + 8,
      });
    }
  }, [isExpanded]);

  const handleItemClick = (item: DockItem) => {
    if ("vibrate" in navigator) {
      navigator.vibrate(10);
    }
    item.onClick();
    setIsExpanded(false);
  };

  const toggleDock = () => {
    if ("vibrate" in navigator) {
      navigator.vibrate(5);
    }
    setIsExpanded(!isExpanded);
  };

  return (
    <>
      {/* 背景遮罩 - 展开时出现 */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={LIQUID_SPRING.backdrop}
            className="fixed inset-0 z-[70] bg-black/40 dark:bg-black/50 backdrop-blur-sm"
            onClick={() => setIsExpanded(false)}
          />
        )}
      </AnimatePresence>

      {/* 展开的菜单项 - 独立 fixed 定位，z-index 高于遮罩 */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed z-[80] flex flex-col-reverse gap-3 items-end"
            style={{
              right: orbRect.right,
              bottom: orbRect.bottom,
            }}
          >
            {items.map((item, index) => (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, scale: 0.5, x: 20 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  x: 0,
                  transition: {
                    ...LIQUID_SPRING.item,
                    delay: index * 0.05,
                  },
                }}
                exit={{
                  opacity: 0,
                  scale: 0.5,
                  x: 20,
                  transition: {
                    duration: 0.15,
                    delay: (items.length - index - 1) * 0.03,
                  },
                }}
                onClick={() => handleItemClick(item)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-2xl",
                  "bg-white/95 border-slate-200/80",
                  "dark:bg-black/80 dark:border-white/10",
                  "backdrop-blur-xl border",
                  item.isActive &&
                    "border-blue-400/50 dark:border-cyan-400/30",
                  "active:scale-95 transition-transform"
                )}
                style={{
                  boxShadow: item.isActive
                    ? "0 0 20px rgba(59, 130, 246, 0.3)"
                    : "0 4px 20px rgba(0, 0, 0, 0.15)",
                }}
              >
                {/* 标签 */}
                <span
                  className={cn(
                    "text-sm font-medium whitespace-nowrap",
                    item.isActive
                      ? "text-slate-800 dark:text-white/95"
                      : "text-slate-600 dark:text-white/70"
                  )}
                >
                  {item.label}
                </span>

                {/* 图标 */}
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    item.isActive
                      ? "bg-blue-500/15 dark:bg-cyan-400/15"
                      : "bg-slate-100 dark:bg-white/5"
                  )}
                >
                  <item.icon
                    className={cn(
                      "w-5 h-5",
                      item.isActive
                        ? "text-blue-500 dark:text-cyan-400"
                        : "text-slate-500 dark:text-white/60"
                    )}
                  />
                </div>

                {/* 选中态能量指示条 */}
                {item.isActive && (
                  <motion.div
                    layoutId="mobileDockIndicator"
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-1 h-6 rounded-full bg-gradient-to-b from-blue-400 to-purple-500 dark:from-cyan-400 dark:to-indigo-500"
                    style={{
                      boxShadow: "0 0 10px rgba(59, 130, 246, 0.5)",
                    }}
                  />
                )}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 底部固定栏 */}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-[75]",
          "flex items-center px-3 py-2",
          "bg-white/90 dark:bg-black/80",
          "backdrop-blur-xl",
          "border-t border-slate-200/60 dark:border-white/10",
          "safe-area-bottom",
          className
        )}
        style={{ paddingBottom: "max(8px, env(safe-area-inset-bottom))" }}
      >
        {/* 左侧：状态栏插槽 */}
        {leftSlot && (
          <div className="flex-1 min-w-0 mr-3 overflow-hidden">{leftSlot}</div>
        )}

        {/* 占位：无 leftSlot 时推能量球到右侧 */}
        {!leftSlot && <div className="flex-1" />}

        {/* 右侧：能量球按钮 */}
        <div className="relative flex-shrink-0">
          <motion.button
            ref={orbBtnRef}
            onClick={toggleDock}
            animate={{
              rotate: isExpanded ? 180 : 0,
              scale: isExpanded ? 0.9 : 1,
            }}
            transition={LIQUID_SPRING.expand}
            className={cn(
              "relative w-11 h-11 rounded-full",
              "flex items-center justify-center",
              "bg-white/95 border-slate-200/80",
              "shadow-lg shadow-slate-200/50",
              "dark:bg-black/80 dark:border-white/10",
              "dark:shadow-lg dark:shadow-black/40",
              "backdrop-blur-xl border",
              "active:scale-90 transition-transform"
            )}
            style={{
              boxShadow: isExpanded
                ? "0 0 30px rgba(59, 130, 246, 0.4)"
                : undefined,
            }}
            aria-label={isExpanded ? "关闭导航" : "打开导航"}
            aria-expanded={isExpanded}
          >
            {/* 能量环 - 呼吸动画 */}
            <motion.div
              className="absolute inset-0 rounded-full"
              animate={{
                boxShadow: [
                  "0 0 0 0 rgba(59, 130, 246, 0)",
                  "0 0 0 6px rgba(59, 130, 246, 0.1)",
                  "0 0 0 0 rgba(59, 130, 246, 0)",
                ],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />

            {/* 图标切换 */}
            <AnimatePresence mode="wait">
              {isExpanded ? (
                <motion.div
                  key="close"
                  initial={{ opacity: 0, rotate: -90 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: 90 }}
                  transition={{ duration: 0.15 }}
                >
                  <X className="w-5 h-5 text-blue-500 dark:text-cyan-400" />
                </motion.div>
              ) : (
                <motion.div
                  key="menu"
                  initial={{ opacity: 0, rotate: 90 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: -90 }}
                  transition={{ duration: 0.15 }}
                >
                  <Menu className="w-5 h-5 text-slate-600 dark:text-white/80" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* 活跃项指示点 */}
            {!isExpanded && items.some((item) => item.isActive) && (
              <motion.div
                className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 dark:from-cyan-400 dark:to-indigo-500"
                style={{
                  boxShadow: "0 0 8px rgba(59, 130, 246, 0.6)",
                }}
                animate={{
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            )}
          </motion.button>
        </div>
      </div>
    </>
  );
}
