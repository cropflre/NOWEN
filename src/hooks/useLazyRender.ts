import { useRef } from 'react'

/**
 * 分类内容始终进入 React 树，交给 CSS `content-visibility: auto` 跳过离屏布局和绘制。
 *
 * 旧实现会在分类接近视口时，通过 IntersectionObserver 一次性挂载整组卡片。
 * 对包含监控组件和大量书签的首页来说，这个滚动过程中的同步 DOM 扩容会触发
 * 明显的布局峰值，并被 Chrome 记录为 Forced reflow。
 *
 * 保留原 Hook 签名，避免调用方产生额外状态切换；ref 仍用于兼容现有结构。
 */
export function useLazyRender(_rootMargin = '200px') {
  const ref = useRef<HTMLDivElement>(null)
  return [ref, true] as const
}
