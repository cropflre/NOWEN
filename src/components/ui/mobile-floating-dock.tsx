/**
 * Mobile Floating Dock - 移动端可展开悬浮坞
 * Vibe: 花瓣式展开，收起时只是右下角的一个小能量球
 * 特性：可拖拽、支持日间/夜间模式
 */
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useDragControls, PanInfo } from "framer-motion";
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
}

// 液态动画配置
const LIQUID_SPRING = {
  // 展开/收起 - 像花瓣绽放
  expand: { type: "spring" as const, stiffness: 300, damping: 25 },
  // 单个项目入场 - 错落有致
  item: { type: "spring" as const, stiffness: 400, damping: 28 },
  // 背景模糊层
  backdrop: { duration: 0.3 },
};

// 存储位置的 key
const POSITION_STORAGE_KEY = 'mobile-dock-position';

export function MobileFloatingDock({
  items,
  className,
}: MobileFloatingDockProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();

  // 从 localStorage 恢复位置
  useEffect(() => {
    try {
      const saved = localStorage.getItem(POSITION_STORAGE_KEY);
      if (saved) {
        const { x, y } = JSON.parse(saved);
        setPosition({ x, y });
      }
    } catch (e) {
      // 忽略解析错误
    }
  }, []);

  // 保存位置到 localStorage
  const savePosition = (x: number, y: number) => {
    try {
      localStorage.setItem(POSITION_STORAGE_KEY, JSON.stringify({ x, y }));
    } catch (e) {
      // 忽略存储错误
    }
  };

  const handleItemClick = (item: DockItem) => {
    // 触觉反馈 (如果支持)
    if ("vibrate" in navigator) {
      navigator.vibrate(10);
    }
    item.onClick();
    setIsExpanded(false);
  };

  const toggleDock = () => {
    // 如果正在拖拽，不触发点击
    if (isDragging) return;
    
    // 触觉反馈
    if ("vibrate" in navigator) {
      navigator.vibrate(5);
    }
    setIsExpanded(!isExpanded);
  };

  // 拖拽结束处理
  const handleDragEnd = (_: any, info: PanInfo) => {
    // 短暂延迟后重置拖拽状态，避免触发点击
    setTimeout(() => setIsDragging(false), 100);
    
    // 计算新位置并保存
    const newX = position.x + info.offset.x;
    const newY = position.y + info.offset.y;
    setPosition({ x: newX, y: newY });
    savePosition(newX, newY);
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
            className="fixed inset-0 z-40 bg-black/40 dark:bg-black/50 backdrop-blur-sm"
            onClick={() => setIsExpanded(false)}
          />
        )}
      </AnimatePresence>

      {/* 悬浮坞容器 - 可拖拽 */}
      <motion.div 
        ref={containerRef}
        className={cn("fixed bottom-6 right-6 z-50 touch-none", className)}
        drag
        dragControls={dragControls}
        dragMomentum={false}
        dragElastic={0.1}
        dragConstraints={{
          top: -window.innerHeight + 100,
          bottom: 0,
          left: -window.innerWidth + 80,
          right: 0,
        }}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
        initial={position}
        animate={{ x: position.x, y: position.y }}
        whileDrag={{ scale: 1.05 }}
      >
        {/* 展开的菜单项 - 花瓣式布局 */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-16 right-0 flex flex-col-reverse gap-3 items-end"
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
                    // 日间模式
                    "bg-white/95 border-slate-200/80",
                    // 夜间模式
                    "dark:bg-black/80 dark:border-white/10",
                    // 通用
                    "backdrop-blur-xl border",
                    // 激活态
                    item.isActive && "border-blue-400/50 dark:border-cyan-400/30",
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

        {/* 主按钮 - 能量球 */}
        <motion.button
          onClick={toggleDock}
          animate={{
            rotate: isExpanded ? 180 : 0,
            scale: isExpanded ? 0.9 : 1,
          }}
          transition={LIQUID_SPRING.expand}
          className={cn(
            "relative w-14 h-14 rounded-full",
            "flex items-center justify-center",
            // 日间模式
            "bg-white/95 border-slate-200/80",
            "shadow-lg shadow-slate-200/50",
            // 夜间模式
            "dark:bg-black/80 dark:border-white/10",
            "dark:shadow-lg dark:shadow-black/40",
            // 通用
            "backdrop-blur-xl border",
            "active:scale-90 transition-transform",
            // 拖拽时显示
            isDragging && "ring-2 ring-blue-400/50 dark:ring-cyan-400/50"
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
                "0 0 0 8px rgba(59, 130, 246, 0.1)",
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
                <X className="w-6 h-6 text-blue-500 dark:text-cyan-400" />
              </motion.div>
            ) : (
              <motion.div
                key="menu"
                initial={{ opacity: 0, rotate: 90 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: -90 }}
                transition={{ duration: 0.15 }}
              >
                <Menu className="w-6 h-6 text-slate-600 dark:text-white/80" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* 活跃项指示点 */}
          {!isExpanded && items.some((item) => item.isActive) && (
            <motion.div
              className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 dark:from-cyan-400 dark:to-indigo-500"
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
      </motion.div>
    </>
  );
}
