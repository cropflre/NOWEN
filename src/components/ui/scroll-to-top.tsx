/**
 * ScrollToTop - 回到顶部按钮
 * Vibe: 玻璃拟态悬浮按钮，滚动一定距离后显示，点击平滑回到顶部
 * 支持日间/夜间模式
 */
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp } from "lucide-react";
import { cn } from "../../lib/utils";

interface ScrollToTopProps {
  /** 滚动多少距离后显示按钮 (默认 300px) */
  threshold?: number;
  /** 自定义样式类名 */
  className?: string;
  /** 按钮位置 */
  position?: "left" | "right";
}

export function ScrollToTop({
  threshold = 300,
  className,
  position = "right",
}: ScrollToTopProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  // 监听滚动事件
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      
      // 是否显示按钮
      setIsVisible(scrollTop > threshold);
      
      // 计算滚动进度 (0-100)
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      setScrollProgress(Math.min(progress, 100));
    };

    // 初始检查
    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [threshold]);

  // 回到顶部
  const scrollToTop = useCallback(() => {
    // 触觉反馈 (移动端)
    if ("vibrate" in navigator) {
      navigator.vibrate(10);
    }
    
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, []);

  // 圆形进度条参数
  const size = 44;
  const strokeWidth = 2.5;
  const radius = (size - strokeWidth - 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (scrollProgress / 100) * circumference;

  // 根据进度计算颜色
  const progressColor = scrollProgress > 80 
    ? "#10b981"  // green
    : "#3b82f6"; // blue (primary)

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.5, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: 30 }}
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 30,
          }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={scrollToTop}
          className={cn(
            "fixed z-40 group cursor-pointer",
            // 尺寸
            "w-11 h-11",
            // 位置
            position === "right" ? "right-4 md:right-6" : "left-4 md:left-6",
            // 桌面端在底部，移动端在 Dock 上方
            "bottom-6 md:bottom-8",
            // 移动端：Dock 在 bottom-6 (24px) + 按钮高度约 56px + 间距
            "max-md:bottom-20",
            className
          )}
          aria-label="回到顶部"
        >
          {/* 玻璃背景 - 适配日间/夜间模式 */}
          <div
            className={cn(
              "absolute inset-0 rounded-full",
              // 日间模式
              "bg-white/90",
              "border border-slate-200/80",
              "shadow-lg shadow-slate-200/50",
              // 夜间模式
              "dark:bg-slate-900/90",
              "dark:border-slate-700/50",
              "dark:shadow-lg dark:shadow-black/30",
              // 毛玻璃
              "backdrop-blur-xl",
              // 悬停效果
              "group-hover:border-blue-400/50 dark:group-hover:border-blue-500/50",
              "group-hover:shadow-blue-500/20 dark:group-hover:shadow-blue-500/20",
              "transition-all duration-300"
            )}
          />

          {/* 环形进度条 SVG */}
          <svg
            className="absolute inset-0 -rotate-90"
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
          >
            {/* 背景轨道 - 适配主题 */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              strokeWidth={strokeWidth}
              className="stroke-slate-200 dark:stroke-slate-700/50"
            />
            {/* 进度弧线 */}
            <motion.circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={progressColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              style={{
                filter: `drop-shadow(0 0 3px ${progressColor}60)`,
              }}
            />
          </svg>

          {/* 箭头图标 */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={{ y: [0, -2, 0] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <ArrowUp
              className={cn(
                "w-5 h-5 relative z-10",
                // 日间模式
                "text-slate-500",
                "group-hover:text-blue-500",
                // 夜间模式
                "dark:text-slate-400",
                "dark:group-hover:text-blue-400",
                "transition-colors duration-200"
              )}
              strokeWidth={2.5}
            />
          </motion.div>

          {/* 进度百分比 - 悬停显示 - 适配主题 */}
          <motion.div
            className={cn(
              "absolute -top-8 left-1/2 -translate-x-1/2",
              "px-2 py-1 rounded-md",
              // 日间模式
              "bg-white/95 border-slate-200",
              "text-slate-600",
              // 夜间模式
              "dark:bg-slate-800/95 dark:border-slate-700/50",
              "dark:text-slate-300",
              // 通用
              "border backdrop-blur-sm",
              "text-[10px] font-mono",
              "opacity-0 group-hover:opacity-100",
              "transition-opacity duration-200",
              "whitespace-nowrap",
              "shadow-sm"
            )}
          >
            {Math.round(scrollProgress)}%
          </motion.div>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
