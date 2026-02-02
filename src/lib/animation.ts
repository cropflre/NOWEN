/**
 * 动画工具库 - 提供 react-spring 封装
 * 用于渐进式替换 framer-motion，减少包体积
 * 
 * react-spring 比 framer-motion 小约 400KB
 * 在性能敏感的组件中优先使用 react-spring
 */

import { useSpring, animated, config as springConfig, SpringConfig } from '@react-spring/web'
import { useState, useCallback, CSSProperties } from 'react'

// 导出 react-spring 原始模块
export { useSpring, useSprings, useTrail, useTransition, animated, config as springConfig } from '@react-spring/web'

// 预设动画配置
export const presets = {
  // 类似 framer-motion 的默认配置
  default: { tension: 170, friction: 26 },
  // 弹性效果
  gentle: springConfig.gentle,
  // 刚性效果
  stiff: springConfig.stiff,
  // 慢速
  slow: springConfig.slow,
  // 快速
  fast: { tension: 280, friction: 20 },
  // 无弹性（类似 CSS transition）
  noWobble: { tension: 200, friction: 26 },
} as const

/**
 * 淡入动画 Hook
 * 替代: motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
 */
export function useFadeIn(options?: { delay?: number; duration?: number }) {
  const { delay = 0, duration } = options || {}
  
  const springProps = useSpring({
    from: { opacity: 0 },
    to: { opacity: 1 },
    delay,
    config: duration ? { duration } : presets.default,
  })
  
  return springProps
}

/**
 * 滑入动画 Hook
 * 替代: motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
 */
export function useSlideIn(options?: { 
  direction?: 'up' | 'down' | 'left' | 'right'
  distance?: number
  delay?: number
}) {
  const { direction = 'up', distance = 20, delay = 0 } = options || {}
  
  const getTransform = () => {
    switch (direction) {
      case 'up': return { y: distance }
      case 'down': return { y: -distance }
      case 'left': return { x: distance }
      case 'right': return { x: -distance }
    }
  }
  
  const from = { opacity: 0, ...getTransform() }
  const to = { opacity: 1, x: 0, y: 0 }
  
  return useSpring({ from, to, delay, config: presets.default })
}

/**
 * 缩放动画 Hook
 * 替代: motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
 */
export function useScale(options?: {
  from?: number
  to?: number
  delay?: number
}) {
  const { from = 0.9, to = 1, delay = 0 } = options || {}
  
  return useSpring({
    from: { transform: `scale(${from})` },
    to: { transform: `scale(${to})` },
    delay,
    config: presets.default,
  })
}

/**
 * Hover 动画 Hook
 * 替代: whileHover={{ scale: 1.02 }}
 */
export function useHoverScale(scale: number = 1.02) {
  const [isHovered, setIsHovered] = useState(false)
  
  const springProps = useSpring({
    transform: isHovered ? `scale(${scale})` : 'scale(1)',
    config: presets.fast,
  })
  
  const bind = {
    onMouseEnter: () => setIsHovered(true),
    onMouseLeave: () => setIsHovered(false),
  }
  
  return { style: springProps, bind }
}

/**
 * Press 动画 Hook
 * 替代: whileTap={{ scale: 0.98 }}
 */
export function usePressScale(scale: number = 0.98) {
  const [isPressed, setIsPressed] = useState(false)
  
  const springProps = useSpring({
    transform: isPressed ? `scale(${scale})` : 'scale(1)',
    config: presets.fast,
  })
  
  const bind = {
    onMouseDown: () => setIsPressed(true),
    onMouseUp: () => setIsPressed(false),
    onMouseLeave: () => setIsPressed(false),
  }
  
  return { style: springProps, bind }
}

/**
 * 组合 Hover + Press 动画
 * 替代: whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
 */
export function useButtonAnimation(options?: {
  hoverScale?: number
  pressScale?: number
}) {
  const { hoverScale = 1.02, pressScale = 0.98 } = options || {}
  const [isHovered, setIsHovered] = useState(false)
  const [isPressed, setIsPressed] = useState(false)
  
  const getScale = () => {
    if (isPressed) return pressScale
    if (isHovered) return hoverScale
    return 1
  }
  
  const springProps = useSpring({
    transform: `scale(${getScale()})`,
    config: presets.fast,
  })
  
  const bind = {
    onMouseEnter: () => setIsHovered(true),
    onMouseLeave: () => {
      setIsHovered(false)
      setIsPressed(false)
    },
    onMouseDown: () => setIsPressed(true),
    onMouseUp: () => setIsPressed(false),
  }
  
  return { style: springProps, bind }
}

/**
 * 交错动画 Hook（用于列表）
 * 替代: transition={{ delay: index * 0.05 }}
 */
export function useStaggeredAnimation(index: number, options?: {
  staggerDelay?: number
  direction?: 'up' | 'down' | 'left' | 'right'
  distance?: number
}) {
  const { staggerDelay = 50, direction = 'up', distance = 20 } = options || {}
  
  const getTransform = () => {
    switch (direction) {
      case 'up': return { y: distance }
      case 'down': return { y: -distance }
      case 'left': return { x: distance }
      case 'right': return { x: -distance }
    }
  }
  
  return useSpring({
    from: { opacity: 0, ...getTransform() },
    to: { opacity: 1, x: 0, y: 0 },
    delay: index * staggerDelay,
    config: presets.default,
  })
}

/**
 * 创建 animated 组件的工厂函数
 * 简化使用语法
 */
export const motion = {
  div: animated.div,
  span: animated.span,
  button: animated.button,
  a: animated.a,
  p: animated.p,
  h1: animated.h1,
  h2: animated.h2,
  h3: animated.h3,
  img: animated.img,
  input: animated.input,
  li: animated.li,
  ul: animated.ul,
  section: animated.section,
  header: animated.header,
  footer: animated.footer,
  nav: animated.nav,
  main: animated.main,
  article: animated.article,
  aside: animated.aside,
}

/**
 * 将 framer-motion 风格的配置转换为 react-spring 配置
 */
export function convertFramerConfig(framerConfig: {
  duration?: number
  delay?: number
  ease?: string
}): SpringConfig & { delay?: number } {
  const { duration, delay } = framerConfig
  
  return {
    ...(duration ? { duration } : presets.default),
    delay,
  }
}

// 类型定义
export type AnimatedStyle = ReturnType<typeof useSpring>

/* ============================================
   The Surface Protocol - 浮出水面协议
   统一的进场动画物理系统
   ============================================ */

/**
 * "浮出水面"的物理质感
 * 模拟物体从水下缓慢浮出的感觉
 */
export const surfacePhysics = {
  type: "spring" as const,
  stiffness: 100, // 刚度低一点，水有阻力
  damping: 20,    // 阻尼适中，不要回弹太多，要稳
  mass: 1.2       // 稍微重一点，有质感
}

/**
 * 统一的进场变体 - 物体浮出水面
 * 用于 framer-motion 的 variants
 */
export const surfaceUpVariant = {
  hidden: { 
    opacity: 0, 
    y: 40,           // 从较深的水下浮上来
    scale: 0.95,     // 水下折射，看起来小一点
    filter: "blur(10px)" // 水下模糊
  },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    filter: "blur(0px)",
    transition: {
      ...surfacePhysics,
      delay: 0.1      // 稍微滞后一点
    }
  },
  exit: {
    opacity: 0,
    y: -20,          // 离开时继续向上蒸发，而不是沉下去
    filter: "blur(10px)",
    transition: { duration: 0.3 }
  }
}

/**
 * 浅浮出 - 用于较小的元素
 */
export const surfaceUpShallowVariant = {
  hidden: { 
    opacity: 0, 
    y: 20,
    scale: 0.98,
    filter: "blur(5px)"
  },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    filter: "blur(0px)",
    transition: {
      type: "spring",
      stiffness: 150,
      damping: 22,
      mass: 1
    }
  },
  exit: {
    opacity: 0,
    y: -10,
    filter: "blur(5px)",
    transition: { duration: 0.2 }
  }
}

/**
 * 交错进场 - 用于列表项
 * @param index 列表索引
 * @param staggerDelay 每项间隔时间(秒)
 */
export const staggeredSurfaceVariant = (index: number, staggerDelay = 0.05) => ({
  hidden: { 
    opacity: 0, 
    y: 30,
    scale: 0.96,
    filter: "blur(8px)"
  },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    filter: "blur(0px)",
    transition: {
      ...surfacePhysics,
      delay: index * staggerDelay
    }
  },
  exit: {
    opacity: 0,
    y: -15,
    filter: "blur(8px)",
    transition: { duration: 0.2 }
  }
})

/**
 * 容器变体 - 用于协调子元素动画
 */
export const containerVariant = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1
    }
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.03,
      staggerDirection: -1
    }
  }
}

/**
 * 弹出变体 - 用于模态框/弹窗
 */
export const popUpVariant = {
  hidden: { 
    opacity: 0, 
    scale: 0.9,
    y: 20,
    filter: "blur(10px)"
  },
  visible: { 
    opacity: 1, 
    scale: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 25,
      mass: 1
    }
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 10,
    filter: "blur(10px)",
    transition: { duration: 0.2 }
  }
}
