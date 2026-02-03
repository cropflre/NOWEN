/**
 * AnimatedNumber - 数字滚轮动画组件
 * 当数值变化时，数字像老虎机一样滚动到新值
 */
import { useEffect, useRef, useState } from 'react'
import { motion, useSpring, useTransform } from 'framer-motion'
import { cn } from '../../lib/utils'

interface AnimatedNumberProps {
  value: number
  className?: string
  duration?: number
  formatFn?: (n: number) => string
  suffix?: string
  prefix?: string
}

export function AnimatedNumber({
  value,
  className,
  duration = 0.8,
  formatFn = (n) => Math.round(n).toString(),
  suffix = '',
  prefix = ''
}: AnimatedNumberProps) {
  const spring = useSpring(value, {
    mass: 0.8,
    stiffness: 75,
    damping: 15,
    duration: duration * 1000
  })

  const display = useTransform(spring, (current) => formatFn(current))
  const [displayValue, setDisplayValue] = useState(formatFn(value))

  useEffect(() => {
    spring.set(value)
  }, [spring, value])

  useEffect(() => {
    const unsubscribe = display.on('change', (v) => {
      setDisplayValue(v)
    })
    return unsubscribe
  }, [display])

  return (
    <span className={cn('tabular-nums', className)}>
      {prefix}{displayValue}{suffix}
    </span>
  )
}

// ============================================
// AnimatedPercentage - 百分比专用组件
// ============================================
interface AnimatedPercentageProps {
  value: number
  className?: string
  decimals?: number
}

export function AnimatedPercentage({
  value,
  className,
  decimals = 0
}: AnimatedPercentageProps) {
  const prevValue = useRef(value)
  const [isIncreasing, setIsIncreasing] = useState(false)

  useEffect(() => {
    setIsIncreasing(value > prevValue.current)
    prevValue.current = value
  }, [value])

  return (
    <motion.span 
      className={cn('tabular-nums font-mono', className)}
      animate={{
        scale: [1, 1.05, 1],
      }}
      transition={{ duration: 0.3 }}
      key={Math.round(value)}
    >
      <AnimatedNumber 
        value={value} 
        formatFn={(n) => n.toFixed(decimals)}
        suffix="%"
      />
      {/* 微小的趋势指示 */}
      <motion.span
        className={cn(
          "inline-block ml-0.5 text-[0.6em]",
          isIncreasing ? "text-rose-400" : "text-green-400"
        )}
        initial={{ opacity: 0, y: isIncreasing ? 5 : -5 }}
        animate={{ opacity: 0.6, y: 0 }}
        transition={{ duration: 0.2 }}
        key={`trend-${value}`}
      >
        {isIncreasing ? '↑' : '↓'}
      </motion.span>
    </motion.span>
  )
}

// ============================================
// RollingDigits - 老虎机风格数字
// ============================================
interface RollingDigitsProps {
  value: number
  className?: string
  digitClassName?: string
}

export function RollingDigits({
  value,
  className,
  digitClassName
}: RollingDigitsProps) {
  const digits = Math.round(value).toString().padStart(2, '0').split('')

  return (
    <span className={cn('inline-flex', className)}>
      {digits.map((digit, index) => (
        <motion.span
          key={index}
          className={cn(
            'inline-block overflow-hidden',
            digitClassName
          )}
          initial={false}
        >
          <motion.span
            className="inline-block"
            animate={{ y: `-${parseInt(digit) * 10}%` }}
            transition={{
              type: 'spring',
              stiffness: 100,
              damping: 15,
              mass: 0.5
            }}
          >
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <span key={n} className="block h-[1em] leading-[1em]">
                {n}
              </span>
            ))}
          </motion.span>
        </motion.span>
      ))}
    </span>
  )
}

export default AnimatedNumber
