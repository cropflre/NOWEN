import { useRef, useState, useEffect, useCallback } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { cn } from "../../lib/utils";
import { Grip } from "lucide-react";

interface DockItemType {
  id: string;
  title: string;
  icon: React.ReactNode;
  href?: string;
  onClick?: () => void;
}

interface FloatingDockProps {
  items: DockItemType[];
  leftItems?: DockItemType[];
  className?: string;
}

// 位置持久化
const DOCK_POSITION_KEY = "desktop-dock-pos";
const DOCK_COLLAPSED_KEY = "desktop-dock-collapsed";

function defaultPos(): { x: number; y: number } {
  return {
    x: Math.round(window.innerWidth / 2),
    y: window.innerHeight - 40,
  };
}

function loadPos(): { x: number; y: number } {
  try {
    const s = localStorage.getItem(DOCK_POSITION_KEY);
    if (s) {
      const { x, y } = JSON.parse(s);
      const px = Number(x),
        py = Number(y);
      if (px > 0 && px < window.innerWidth && py > 0 && py < window.innerHeight) {
        return { x: px, y: py };
      }
    }
  } catch {
    /* */
  }
  return defaultPos();
}

function loadCollapsed(): boolean {
  try {
    return localStorage.getItem(DOCK_COLLAPSED_KEY) === "true";
  } catch {
    return false;
  }
}

export function FloatingDock({
  items,
  leftItems,
  className,
}: FloatingDockProps) {
  const hoverMouseX = useMotionValue(Infinity);
  const [isDark, setIsDark] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(loadCollapsed);
  const dockRef = useRef<HTMLDivElement>(null);

  // 拖拽位置状态
  const posRef = useRef(loadPos());
  const [pos, setPos] = useState(posRef.current);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const dragStartMouse = useRef({ x: 0, y: 0 });
  const hasDragged = useRef(false);

  // 入场动画
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setEntered(true), 300);
    return () => clearTimeout(t);
  }, []);

  // 主题监听
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    setIsDark(document.documentElement.classList.contains("dark"));
    return () => observer.disconnect();
  }, []);

  // 收缩状态持久化
  const toggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(DOCK_COLLAPSED_KEY, String(next));
      } catch {
        /* */
      }
      return next;
    });
  }, []);

  const savePos = useCallback((x: number, y: number) => {
    posRef.current = { x, y };
    try {
      localStorage.setItem(DOCK_POSITION_KEY, JSON.stringify({ x, y }));
    } catch {
      /* */
    }
  }, []);

  // 原生 pointer 事件拖拽
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      // 收缩态：整个球都可拖拽；展开态：只有非按钮区域可拖拽
      if (!isCollapsed && (e.target as HTMLElement).closest("button")) return;
      e.preventDefault();
      setIsDragging(true);
      hasDragged.current = false;
      dragStartPos.current = { ...posRef.current };
      dragStartMouse.current = { x: e.clientX, y: e.clientY };
      dockRef.current?.setPointerCapture(e.pointerId);
      hoverMouseX.set(Infinity);
    },
    [hoverMouseX, isCollapsed]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) {
        if (!isCollapsed) hoverMouseX.set(e.clientX);
        return;
      }
      const dx = e.clientX - dragStartMouse.current.x;
      const dy = e.clientY - dragStartMouse.current.y;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasDragged.current = true;
      const nx = Math.max(30, Math.min(window.innerWidth - 30, dragStartPos.current.x + dx));
      const ny = Math.max(30, Math.min(window.innerHeight - 20, dragStartPos.current.y + dy));
      posRef.current = { x: nx, y: ny };
      setPos({ x: nx, y: ny });
    },
    [isDragging, hoverMouseX, isCollapsed]
  );

  const handlePointerUp = useCallback(() => {
    if (!isDragging) return;
    savePos(posRef.current.x, posRef.current.y);
    const didDrag = hasDragged.current;
    setTimeout(() => {
      setIsDragging(false);
      // 收缩态下，如果没有拖拽则切换展开
      if (isCollapsed && !didDrag) {
        toggleCollapse();
      }
    }, 50);
  }, [isDragging, savePos, isCollapsed, toggleCollapse]);

  return (
    <div
      ref={dockRef}
      className={cn(
        "fixed z-50 select-none",
        isDragging ? "cursor-grabbing" : "",
        entered ? "opacity-100" : "opacity-0 translate-y-8",
        className
      )}
      style={{
        left: pos.x,
        top: pos.y,
        transform: "translate(-50%, -50%)",
        transition: isDragging
          ? "none"
          : "opacity 0.5s cubic-bezier(0.22, 1, 0.36, 1), transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)",
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onMouseLeave={() => {
        if (!isDragging) hoverMouseX.set(Infinity);
      }}
    >
      <AnimatePresence mode="wait">
        {isCollapsed ? (
          /* ========== 收缩态：能量球 ========== */
          <motion.div
            key="orb"
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.3, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center",
              "backdrop-blur-xl border cursor-pointer",
              isDark
                ? "bg-black/70 border-white/15 shadow-lg shadow-black/40"
                : "bg-white/90 border-slate-200/80 shadow-lg shadow-slate-200/50"
            )}
            style={{
              boxShadow: isDark
                ? "0 0 20px rgba(34, 211, 238, 0.15), 0 4px 20px rgba(0,0,0,0.4)"
                : "0 0 20px rgba(59, 130, 246, 0.1), 0 4px 20px rgba(0,0,0,0.1)",
            }}
          >
            <Grip
              className={cn(
                "w-5 h-5",
                isDark ? "text-cyan-400/80" : "text-blue-500/70"
              )}
            />
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
          </motion.div>
        ) : (
          /* ========== 展开态：完整 Dock ========== */
          <motion.div
            key="dock"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="flex items-end gap-2 px-4 py-3 rounded-2xl"
            style={{
              background: "var(--color-glass)",
              backdropFilter: "blur(24px) saturate(180%)",
              WebkitBackdropFilter: "blur(24px) saturate(180%)",
              border: isDragging
                ? `2px solid ${isDark ? "rgba(34, 211, 238, 0.5)" : "rgba(59, 130, 246, 0.5)"}`
                : "1px solid var(--color-glass-border)",
              boxShadow: isDragging
                ? isDark
                  ? "0 0 20px rgba(34, 211, 238, 0.3)"
                  : "0 0 20px rgba(59, 130, 246, 0.3)"
                : isDark
                  ? "none"
                  : "var(--color-shadow)",
              transition: "border 0.2s, box-shadow 0.2s",
            }}
          >
            {/* 收缩按钮 */}
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                if (!isDragging) toggleCollapse();
              }}
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mb-2",
                "transition-colors duration-200",
                isDark
                  ? "hover:bg-white/10 text-white/40 hover:text-cyan-400/80"
                  : "hover:bg-black/5 text-slate-400 hover:text-blue-500/70"
              )}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title="收缩为球"
            >
              <Grip className="w-4 h-4" />
            </motion.button>

            <div
              className="w-px h-8 mx-1 mb-2"
              style={{ background: "var(--color-glass-border)" }}
            />

            {leftItems && leftItems.length > 0 && (
              <>
                {leftItems.map((item) => (
                  <DockItem
                    key={item.id}
                    mouseX={hoverMouseX}
                    isDark={isDark}
                    isDragging={isDragging}
                    {...item}
                  />
                ))}
                <div
                  className="w-px h-8 mx-1"
                  style={{ background: "var(--color-glass-border)" }}
                />
              </>
            )}
            {items.map((item) => (
              <DockItem
                key={item.id}
                mouseX={hoverMouseX}
                isDark={isDark}
                isDragging={isDragging}
                {...item}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface DockItemProps {
  id: string;
  title: string;
  icon: React.ReactNode;
  href?: string;
  onClick?: () => void;
  mouseX: ReturnType<typeof useMotionValue<number>>;
  isDark: boolean;
  isDragging: boolean;
}

function DockItem({
  title,
  icon,
  href,
  onClick,
  mouseX,
  isDark,
  isDragging,
}: DockItemProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const distance = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const widthSync = useTransform(distance, [-150, 0, 150], [48, 72, 48]);
  const heightSync = useTransform(distance, [-150, 0, 150], [48, 72, 48]);

  const width = useSpring(widthSync, {
    mass: 0.1,
    stiffness: 200,
    damping: 15,
  });
  const height = useSpring(heightSync, {
    mass: 0.1,
    stiffness: 200,
    damping: 15,
  });

  const handleClick = () => {
    if (isDragging) return;
    if (onClick) {
      onClick();
    } else if (href) {
      window.open(href, "_blank");
    }
  };

  return (
    <motion.div
      ref={ref}
      style={{ width, height }}
      className="relative flex items-center justify-center"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <AnimatePresence>
        {isHovered && !isDragging && (
          <motion.div
            className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg whitespace-nowrap"
            style={{
              background: "var(--color-bg-secondary)",
              border: "1px solid var(--color-glass-border)",
              boxShadow: isDark ? "none" : "var(--color-shadow)",
            }}
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.8 }}
            transition={{ duration: 0.15 }}
          >
            <span
              className="text-sm font-medium"
              style={{ color: "var(--color-text-primary)" }}
            >
              {title}
            </span>
            <div
              className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45"
              style={{
                background: "var(--color-bg-secondary)",
                borderRight: "1px solid var(--color-glass-border)",
                borderBottom: "1px solid var(--color-glass-border)",
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={handleClick}
        className="w-full h-full rounded-xl flex items-center justify-center cursor-pointer overflow-hidden"
        style={{
          background: isHovered
            ? "var(--color-glass-hover)"
            : "var(--color-glass)",
          border: `1px solid ${
            isHovered ? "var(--color-primary)" : "var(--color-glass-border)"
          }`,
          color: isHovered
            ? "var(--color-primary)"
            : "var(--color-text-secondary)",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
        whileTap={{ scale: 0.9 }}
      >
        <motion.div
          style={{
            scale: useTransform(width, [48, 72], [1, 1.2]),
          }}
        >
          {icon}
        </motion.div>
      </motion.button>

      {isDark && (
        <motion.div
          className="absolute inset-0 rounded-xl pointer-events-none"
          style={{ boxShadow: `0 0 25px var(--color-glow)` }}
          animate={{ opacity: isHovered ? 0.8 : 0 }}
          transition={{ duration: 0.2 }}
        />
      )}

      {!isDark && (
        <motion.div
          className="absolute inset-0 rounded-xl pointer-events-none"
          animate={{
            boxShadow: isHovered ? "var(--color-shadow-hover)" : "none",
            y: isHovered ? -2 : 0,
          }}
          transition={{ duration: 0.2 }}
        />
      )}

      {isDark && isHovered && (
        <motion.div
          className="absolute inset-0 rounded-xl pointer-events-none"
          style={{
            background: `linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%)`,
            padding: "1px",
            WebkitMask:
              "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        />
      )}
    </motion.div>
  );
}
