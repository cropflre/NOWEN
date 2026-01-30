"use client"
import { cn } from "../../lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import React, { useRef, useState, useEffect } from "react"

export const BackgroundBeamsWithCollision = ({
  children,
  className,
  isDark = true,
}: {
  children?: React.ReactNode
  className?: string
  isDark?: boolean
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const parentRef = useRef<HTMLDivElement>(null)

  const beams = [
    { initialX: 10, translateX: 10, duration: 7, repeatDelay: 3, delay: 2 },
    { initialX: 600, translateX: 600, duration: 3, repeatDelay: 3, delay: 4 },
    { initialX: 100, translateX: 100, duration: 7, repeatDelay: 7, className: "h-6" },
    { initialX: 400, translateX: 400, duration: 5, repeatDelay: 14, delay: 4 },
    { initialX: 800, translateX: 800, duration: 11, repeatDelay: 2, className: "h-20" },
    { initialX: 1000, translateX: 1000, duration: 4, repeatDelay: 2, className: "h-12" },
    { initialX: 1200, translateX: 1200, duration: 6, repeatDelay: 4, delay: 2, className: "h-6" },
    { initialX: 200, translateX: 200, duration: 8, repeatDelay: 5, delay: 1 },
    { initialX: 1400, translateX: 1400, duration: 5, repeatDelay: 6, className: "h-8" },
    { initialX: 300, translateX: 300, duration: 9, repeatDelay: 4, delay: 3, className: "h-16" },
  ]

  // 日间模式使用不同的颜色
  const beamGradient = isDark
    ? "linear-gradient(to top, var(--color-glow), var(--color-glow-secondary), transparent)"
    : "linear-gradient(to top, rgba(59, 130, 246, 0.6), rgba(147, 51, 234, 0.4), transparent)"
  
  const beamShadow = isDark
    ? "0 0 8px var(--color-glow), 0 0 16px var(--color-glow-secondary)"
    : "0 0 8px rgba(59, 130, 246, 0.5), 0 0 16px rgba(147, 51, 234, 0.3)"
  
  const lineGradient = isDark
    ? "linear-gradient(90deg, transparent 10%, var(--color-glow) 50%, transparent 90%)"
    : "linear-gradient(90deg, transparent 10%, rgba(59, 130, 246, 0.5) 50%, transparent 90%)"
  
  const lineShadow = isDark
    ? "0 0 20px 5px var(--color-glow), 0 0 40px 10px var(--color-glow-secondary)"
    : "0 0 15px 3px rgba(59, 130, 246, 0.4), 0 0 30px 8px rgba(147, 51, 234, 0.2)"

  return (
    <div
      ref={parentRef}
      className={cn(
        "relative flex items-center w-full h-full justify-center overflow-hidden",
        className
      )}
    >
      {beams.map((beam) => (
        <CollisionMechanism
          key={beam.initialX + "beam-idx"}
          beamOptions={beam}
          containerRef={containerRef}
          parentRef={parentRef}
          isDark={isDark}
          beamGradient={beamGradient}
          beamShadow={beamShadow}
        />
      ))}

      {children}
      
      {/* 底部碰撞线 */}
      <div
        ref={containerRef}
        className="absolute bottom-0 w-full inset-x-0 pointer-events-none h-1"
        style={{
          background: lineGradient,
          boxShadow: lineShadow,
        }}
      />
    </div>
  )
}

const CollisionMechanism = React.forwardRef<
  HTMLDivElement,
  {
    containerRef: React.RefObject<HTMLDivElement>
    parentRef: React.RefObject<HTMLDivElement>
    isDark?: boolean
    beamGradient?: string
    beamShadow?: string
    beamOptions?: {
      initialX?: number
      translateX?: number
      initialY?: number
      translateY?: number
      rotate?: number
      className?: string
      duration?: number
      delay?: number
      repeatDelay?: number
    }
  }
>(({ parentRef, containerRef, beamOptions = {}, isDark = true, beamGradient, beamShadow }, _ref) => {
  const beamRef = useRef<HTMLDivElement>(null)
  const [collision, setCollision] = useState<{
    detected: boolean
    coordinates: { x: number; y: number } | null
  }>({
    detected: false,
    coordinates: null,
  })
  const [beamKey, setBeamKey] = useState(0)
  const [cycleCollisionDetected, setCycleCollisionDetected] = useState(false)

  useEffect(() => {
    const checkCollision = () => {
      if (
        beamRef.current &&
        containerRef.current &&
        parentRef.current &&
        !cycleCollisionDetected
      ) {
        const beamRect = beamRef.current.getBoundingClientRect()
        const containerRect = containerRef.current.getBoundingClientRect()
        const parentRect = parentRef.current.getBoundingClientRect()

        if (beamRect.bottom >= containerRect.top) {
          const relativeX = beamRect.left - parentRect.left + beamRect.width / 2
          const relativeY = beamRect.bottom - parentRect.top

          setCollision({
            detected: true,
            coordinates: { x: relativeX, y: relativeY },
          })
          setCycleCollisionDetected(true)
        }
      }
    }

    const animationInterval = setInterval(checkCollision, 50)
    return () => clearInterval(animationInterval)
  }, [cycleCollisionDetected, containerRef, parentRef])

  useEffect(() => {
    if (collision.detected && collision.coordinates) {
      setTimeout(() => {
        setCollision({ detected: false, coordinates: null })
        setCycleCollisionDetected(false)
      }, 2000)

      setTimeout(() => {
        setBeamKey((prevKey) => prevKey + 1)
      }, 2000)
    }
  }, [collision])

  return (
    <>
      <motion.div
        key={beamKey}
        ref={beamRef}
        animate="animate"
        initial={{
          translateY: beamOptions.initialY || "-200px",
          translateX: beamOptions.initialX || "0px",
          rotate: beamOptions.rotate || 0,
        }}
        variants={{
          animate: {
            translateY: beamOptions.translateY || "1800px",
            translateX: beamOptions.translateX || "0px",
            rotate: beamOptions.rotate || 0,
          },
        }}
        transition={{
          duration: beamOptions.duration || 8,
          repeat: Infinity,
          repeatType: "loop",
          ease: "linear",
          delay: beamOptions.delay || 0,
          repeatDelay: beamOptions.repeatDelay || 0,
        }}
        className={cn(
          "absolute left-0 top-20 m-auto h-14 w-px rounded-full",
          beamOptions.className
        )}
        style={{
          background: beamGradient || "linear-gradient(to top, var(--color-glow), var(--color-glow-secondary), transparent)",
          boxShadow: beamShadow || "0 0 8px var(--color-glow), 0 0 16px var(--color-glow-secondary)",
        }}
      />
      <AnimatePresence>
        {collision.detected && collision.coordinates && (
          <Explosion
            key={`${collision.coordinates.x}-${collision.coordinates.y}`}
            isDark={isDark}
            style={{
              left: `${collision.coordinates.x}px`,
              top: `${collision.coordinates.y}px`,
              transform: "translate(-50%, -50%)",
            }}
          />
        )}
      </AnimatePresence>
    </>
  )
})

CollisionMechanism.displayName = "CollisionMechanism"

const Explosion = ({ isDark = true, ...props }: React.HTMLProps<HTMLDivElement> & { isDark?: boolean }) => {
  const spans = Array.from({ length: 20 }, (_, index) => ({
    id: index,
    initialX: 0,
    initialY: 0,
    directionX: Math.floor(Math.random() * 80 - 40),
    directionY: Math.floor(Math.random() * -50 - 10),
  }))

  // 日间模式使用更明亮的颜色
  const glowGradient = isDark
    ? "linear-gradient(to right, transparent, var(--color-glow), transparent)"
    : "linear-gradient(to right, transparent, rgba(59, 130, 246, 0.7), transparent)"
  
  const particleGradient = isDark
    ? "linear-gradient(to bottom, var(--color-glow), var(--color-glow-secondary))"
    : "linear-gradient(to bottom, rgba(59, 130, 246, 0.8), rgba(147, 51, 234, 0.6))"
  
  const particleShadow = isDark
    ? "0 0 4px var(--color-glow)"
    : "0 0 4px rgba(59, 130, 246, 0.6)"

  return (
    <div {...props} className={cn("absolute z-50 h-2 w-2", props.className)}>
      {/* 中心光晕 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="absolute -inset-x-10 top-0 m-auto h-2 w-10 rounded-full blur-sm"
        style={{
          background: glowGradient,
        }}
      />
      {/* 粒子散射 */}
      {spans.map((span) => (
        <motion.span
          key={span.id}
          initial={{ x: span.initialX, y: span.initialY, opacity: 1 }}
          animate={{
            x: span.directionX,
            y: span.directionY,
            opacity: 0,
          }}
          transition={{ duration: Math.random() * 1.5 + 0.5, ease: "easeOut" }}
          className="absolute h-1 w-1 rounded-full"
          style={{
            background: particleGradient,
            boxShadow: particleShadow,
          }}
        />
      ))}
    </div>
  )
}

export default BackgroundBeamsWithCollision
