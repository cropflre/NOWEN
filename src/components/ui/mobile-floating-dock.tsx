/**
 * Mobile Floating Dock - 移动端
 * 底部固定状态栏 + 独立可自由拖拽的能量球
 * 花瓣式展开菜单，支持日间/夜间模式
 */
import { useState, useRef, useCallback } from "react";
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
  /** 底部栏插槽，用于放置状态栏等 */
  leftSlot?: React.ReactNode;
}

// 液态动画配置
const LIQUID_SPRING = {
  expand: { type: "spring" as const, stiffness: 300, damping: 25 },
  item: { type: "spring" as const, stiffness: 400, damping: 28 },
  backdrop: { duration: 0.3 },
};

// 能量球位置持久化
const MOBILE_DOCK_POS_KEY = "mobile-dock-pos";
const DRAG_THRESHOLD = 6;

function defaultMobilePos(): { x: number; y: number } {
  return {
    x: window.innerWidth - 36,
    y: window.innerHeight - 100,
  };
}

function loadMobilePos(): { x: number; y: number } {
  try {
    const s = localStorage.getItem(MOBILE_DOCK_POS_KEY);
    if (s) {
      const { x, y } = JSON.parse(s);
      const px = Number(x),
        py = Number(y);
      if (
        px > 28 &&
        px < window.innerWidth - 28 &&
        py > 28 &&
        py < window.innerHeight - 28
      ) {
        return { x: px, y: py };
      }
    }
  } catch {
    /* */
  }
  return defaultMobilePos();
}

export function MobileFloatingDock({
  items,
  className,
  leftSlot,
}: MobileFloatingDockProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const orbRef = useRef<HTMLDivElement>(null);

  // 拖拽位置
  const posRef = useRef(loadMobilePos());
  const [pos, setPos] = useState(posRef.current);
  const dragStartMouse = useRef({ x: 0, y: 0 });
  const dragStartPos = useRef({ x: 0, y: 0 });
  const hasMoved = useRef(false);

  const savePos = useCallback((x: number, y: number) => {
    posRef.current = { x, y };
    try {
      localStorage.setItem(MOBILE_DOCK_POS_KEY, JSON.stringify({ x, y }));
    } catch {
      /* */
    }
  }, []);

  const handleItemClick = (item: DockItem) => {
    if ("vibrate" in navigator) {
      navigator.vibrate(10);
    }
    item.onClick();
    setIsExpanded(false);
  };

  const toggleDock = useCallback(() => {
    if ("vibrate" in navigator) {
      navigator.vibrate(5);
    }
    setIsExpanded((prev) => !prev);
  }, []);

  // 拖拽事件
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    hasMoved.current = false;
    dragStartMouse.current = { x: e.clientX, y: e.clientY };
    dragStartPos.current = { ...posRef.current };
    orbRef.current?.setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!orbRef.current?.hasPointerCapture(e.pointerId)) return;

      const dx = e.clientX - dragStartMouse.current.x;
      const dy = e.clientY - dragStartMouse.current.y;

      if (
        !hasMoved.current &&
        Math.abs(dx) < DRAG_THRESHOLD &&
        Math.abs(dy) < DRAG_THRESHOLD
      ) {
        return;
      }

      hasMoved.current = true;
      if (!isDragging) setIsDragging(true);

      const nx = Math.max(
        28,
        Math.min(window.innerWidth - 28, dragStartPos.current.x + dx)
      );
      const ny = Math.max(
        28,
        Math.min(window.innerHeight - 28, dragStartPos.current.y + dy)
      );
      posRef.current = { x: nx, y: ny };
      setPos({ x: nx, y: ny });
    },
    [isDragging]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      orbRef.current?.releasePointerCapture(e.pointerId);
      if (hasMoved.current) {
        // 拖拽结束 — 保存位置，不触发点击
        savePos(posRef.current.x, posRef.current.y);
        setTimeout(() => setIsDragging(false), 50);
      } else {
        // 没有移动 — 当作点击，展开/收起菜单
        toggleDock();
      }
    },
    [savePos, toggleDock]
  );

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
            className="fixed inset-0 z-40 bg-black/40 dark:bg-black/50 backdrop-blur-sm"
            onClick={() => setIsExpanded(false)}
          />
        )}
      </AnimatePresence>

      {/* 底部固定状态栏 */}
      {leftSlot && (
        <div
          className={cn(
            "fixed bottom-0 left-0 right-0 z-50",
            "flex items-center justify-center px-3 py-2",
            "bg-white/90 dark:bg-black/80",
            "backdrop-blur-xl",
            "border-t border-slate-200/60 dark:border-white/10",
            "safe-area-bottom",
            className
          )}
          style={{ paddingBottom: "max(8px, env(safe-area-inset-bottom))" }}
        >
          <div className="min-w-0 overflow-hidden">{leftSlot}</div>
        </div>
      )}

      {/* 独立悬浮能量球 - 自由拖拽 */}
      <div
        ref={orbRef}
        className="fixed z-[60] touch-none"
        style={{
          left: pos.x,
          top: pos.y,
          transform: "translate(-50%, -50%)",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {/* 展开的菜单项 - 花瓣式布局 */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-14 right-0 flex flex-col-reverse gap-3 items-end"
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

        {/* 主按钮 - 能量球 */}
        <motion.button
          animate={{
            rotate: isExpanded ? 180 : 0,
            scale: isDragging ? 1.1 : isExpanded ? 0.9 : 1,
          }}
          transition={LIQUID_SPRING.expand}
          className={cn(
            "relative w-12 h-12 rounded-full",
            "flex items-center justify-center",
            "bg-white/95 border-slate-200/80",
            "shadow-lg shadow-slate-200/50",
            "dark:bg-black/80 dark:border-white/10",
            "dark:shadow-lg dark:shadow-black/40",
            "backdrop-blur-xl border",
            isDragging ? "cursor-grabbing" : ""
          )}
          style={{
            boxShadow: isDragging
              ? "0 0 30px rgba(59, 130, 246, 0.5), 0 0 60px rgba(59, 130, 246, 0.2)"
              : isExpanded
                ? "0 0 30px rgba(59, 130, 246, 0.4)"
                : undefined,
            borderColor: isDragging
              ? "rgba(59, 130, 246, 0.5)"
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
    </>
  );
}
