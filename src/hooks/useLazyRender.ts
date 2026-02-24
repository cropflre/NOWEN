import { useRef, useState, useEffect } from 'react'

/**
 * 懒渲染 Hook：基于 IntersectionObserver 实现分类区块的视口检测
 * 当元素进入视口时标记为可渲染，离开视口后保持已渲染状态（避免滚动回去时闪烁）
 * 
 * @param rootMargin 提前触发的距离（默认 200px，即视口外 200px 就开始渲染）
 * @returns [ref, shouldRender] ref 绑定到容器元素，shouldRender 表示是否应该渲染内容
 */
export function useLazyRender(rootMargin = '200px') {
  const ref = useRef<HTMLDivElement>(null)
  const [shouldRender, setShouldRender] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // 如果浏览器不支持 IntersectionObserver，直接渲染
    if (typeof IntersectionObserver === 'undefined') {
      setShouldRender(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldRender(true)
          // 一旦渲染后就不再需要观察
          observer.unobserve(el)
        }
      },
      {
        rootMargin, // 提前 200px 开始渲染，用户滚动到时内容已就绪
        threshold: 0,
      }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [rootMargin])

  return [ref, shouldRender] as const
}
