"use client"

import React, { useCallback, useEffect, useMemo, useState } from "react"
import { cn } from "../../lib/utils"

interface BeamOptions {
  left: string
  duration: number
  delay: number
  repeatDelay: number
  height: number
  width: number
}

interface BackgroundBeamsWithCollisionProps {
  children?: React.ReactNode
  className?: string
  containerClassName?: string
  isDark?: boolean
  isMobile?: boolean
  /** Kept for compatibility. The NOWEN animation switch is the explicit source of truth. */
  reducedMotion?: boolean
  paused?: boolean
}

interface Explosion {
  id: number
  left: string
}

type AnimationStyle = React.CSSProperties & Record<`--${string}`, string | number>

const DESKTOP_BEAMS: BeamOptions[] = [
  { left: "4%", duration: 6.4, delay: -2.8, repeatDelay: 0.9, height: 132, width: 2 },
  { left: "17%", duration: 7.2, delay: -5.1, repeatDelay: 1.2, height: 96, width: 2.5 },
  { left: "30%", duration: 5.8, delay: -1.6, repeatDelay: 1.1, height: 118, width: 2 },
  { left: "43%", duration: 7.8, delay: -6.2, repeatDelay: 0.8, height: 154, width: 3 },
  { left: "57%", duration: 6.8, delay: -3.7, repeatDelay: 1.4, height: 108, width: 2.5 },
  { left: "70%", duration: 8.1, delay: -7.1, repeatDelay: 0.9, height: 146, width: 3 },
  { left: "83%", duration: 6.1, delay: -4.5, repeatDelay: 1.3, height: 102, width: 2 },
  { left: "96%", duration: 7.4, delay: -2.2, repeatDelay: 1, height: 126, width: 2.5 },
]

const MOBILE_BEAMS: BeamOptions[] = [
  { left: "18%", duration: 7.4, delay: -4.8, repeatDelay: 1.8, height: 92, width: 2 },
  { left: "51%", duration: 8.2, delay: -2.7, repeatDelay: 2.2, height: 114, width: 2.5 },
  { left: "84%", duration: 7.8, delay: -6.1, repeatDelay: 2, height: 98, width: 2 },
]

const BEAM_STYLES = `
  @keyframes nowen-beam-fall {
    0% {
      transform: translate3d(0, calc(-1 * var(--beam-offset)), 0);
      opacity: 0.28;
    }
    8% { opacity: 1; }
    70% { opacity: 1; }
    92% { opacity: 0.92; }
    100% {
      transform: translate3d(0, calc(100vh + var(--beam-offset)), 0);
      opacity: 0.18;
    }
  }

  @keyframes nowen-impact-life {
    0%, 82% { opacity: 1; }
    100% { opacity: 0; }
  }

  @keyframes nowen-impact-ring {
    0% { transform: translate3d(-50%, 0, 0) scale(0.12); opacity: 1; }
    100% { transform: translate3d(-50%, -8px, 0) scale(1); opacity: 0; }
  }

  @keyframes nowen-impact-core {
    0% { transform: translate3d(-50%, 0, 0) scale(0.35); opacity: 1; }
    50% { transform: translate3d(-50%, -3px, 0) scale(1.8); opacity: 0.82; }
    100% { transform: translate3d(-50%, -5px, 0) scale(0.15); opacity: 0; }
  }

  @keyframes nowen-impact-droplet {
    0% { transform: translate3d(0, 0, 0) rotate(0deg) scale(0.9); opacity: 1; }
    58% { transform: translate3d(var(--drop-x), var(--drop-y), 0) rotate(var(--drop-rotate)) scale(1.12); opacity: 0.94; }
    100% { transform: translate3d(var(--drop-x-end), 10px, 0) rotate(var(--drop-rotate-end)) scale(0.24); opacity: 0; }
  }

  .nowen-beam-streak {
    animation-name: nowen-beam-fall;
    animation-timing-function: linear;
    animation-iteration-count: infinite;
    transform: translate3d(0, 0, 0);
    backface-visibility: hidden;
    will-change: transform, opacity;
  }

  .nowen-impact {
    animation: nowen-impact-life 1050ms linear forwards;
    transform: translateZ(0);
    contain: layout paint style;
  }

  .nowen-impact-ring {
    animation: nowen-impact-ring 820ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  .nowen-impact-core {
    animation: nowen-impact-core 780ms ease-out forwards;
  }

  .nowen-impact-droplet {
    animation-name: nowen-impact-droplet;
    animation-timing-function: cubic-bezier(0.16, 0.84, 0.32, 1);
    animation-fill-mode: forwards;
    transform: translateZ(0);
    will-change: transform, opacity;
  }
`

export const BackgroundBeamsWithCollision = ({
  children,
  className,
  containerClassName,
  isDark = true,
  isMobile = false,
  paused = false,
}: BackgroundBeamsWithCollisionProps) => {
  const beams = isMobile ? MOBILE_BEAMS : DESKTOP_BEAMS
  const [explosions, setExplosions] = useState<Explosion[]>([])
  const [isDocumentVisible, setIsDocumentVisible] = useState(() =>
    typeof document === "undefined" || document.visibilityState !== "hidden",
  )

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsDocumentVisible(document.visibilityState !== "hidden")
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange)
  }, [])

  const animationPaused = paused || !isDocumentVisible

  const beamGradient = isDark
    ? "linear-gradient(to top, rgba(103, 232, 249, 1), rgba(129, 140, 248, 1) 38%, rgba(192, 132, 252, 0.72) 68%, transparent)"
    : "linear-gradient(to top, rgba(14, 116, 255, 0.98), rgba(124, 58, 237, 0.94) 40%, rgba(6, 182, 212, 0.62) 70%, transparent)"

  const beamShadow = isDark
    ? "0 0 10px rgba(103, 232, 249, 0.9), 0 0 24px rgba(129, 140, 248, 0.68)"
    : "0 0 9px rgba(37, 99, 235, 0.72), 0 0 22px rgba(124, 58, 237, 0.52)"

  const lineGradient = isDark
    ? "linear-gradient(90deg, transparent 1%, rgba(103, 232, 249, 0.32) 24%, rgba(129, 140, 248, 0.72) 50%, rgba(103, 232, 249, 0.32) 76%, transparent 99%)"
    : "linear-gradient(90deg, transparent 1%, rgba(37, 99, 235, 0.26) 24%, rgba(124, 58, 237, 0.58) 50%, rgba(14, 165, 233, 0.26) 76%, transparent 99%)"

  const lineShadow = isDark
    ? "0 0 18px 3px rgba(103, 232, 249, 0.25), 0 0 34px 8px rgba(129, 140, 248, 0.18)"
    : "0 0 15px 2px rgba(37, 99, 235, 0.2), 0 0 30px 7px rgba(124, 58, 237, 0.14)"

  const explosionColor = isDark ? "rgb(103, 232, 249)" : "rgb(29, 78, 216)"
  const explosionAccent = isDark ? "rgb(192, 132, 252)" : "rgb(124, 58, 237)"

  const addExplosion = useCallback((left: string) => {
    const id = Date.now() + Math.random()
    // Keep the visual impact while bounding transient DOM work on slower devices.
    setExplosions((current) => [...current.slice(-4), { id, left }])
  }, [])

  const removeExplosion = useCallback((id: number) => {
    setExplosions((current) => current.filter((explosion) => explosion.id !== id))
  }, [])

  return (
    <div
      data-testid="background-beams"
      data-beam-count={beams.length}
      data-animation-profile="compositor"
      data-paused={animationPaused ? "true" : "false"}
      className={cn("absolute inset-0 overflow-hidden pointer-events-none", containerClassName)}
      style={{ contain: "layout paint style" }}
    >
      <style>{BEAM_STYLES}</style>
      <div className={cn("relative h-full w-full overflow-hidden", className)}>
        {beams.map((beam, index) => (
          <BeamEffect
            key={`${beam.left}-${index}`}
            beamOptions={beam}
            beamGradient={beamGradient}
            beamShadow={beamShadow}
            paused={animationPaused}
            onCollision={addExplosion}
          />
        ))}

        {children}

        {explosions.map((explosion) => (
          <ImpactDroplets
            key={explosion.id}
            left={explosion.left}
            color={explosionColor}
            accent={explosionAccent}
            mobile={isMobile}
            onComplete={() => removeExplosion(explosion.id)}
          />
        ))}

        <div
          className="absolute bottom-0 inset-x-0 h-[2px]"
          style={{
            background: lineGradient,
            boxShadow: lineShadow,
          }}
        />
      </div>
    </div>
  )
}

const ImpactDroplets = React.memo(({
  left,
  color,
  accent,
  mobile,
  onComplete,
}: {
  left: string
  color: string
  accent: string
  mobile: boolean
  onComplete: () => void
}) => {
  const particleCount = mobile ? 7 : 10
  const particles = useMemo(
    () => Array.from({ length: particleCount }, (_, index) => {
      const progress = particleCount === 1 ? 0.5 : index / (particleCount - 1)
      const angle = Math.PI + progress * Math.PI
      const variance = ((index * 17) % 11) / 11
      const speed = (mobile ? 24 : 32) + variance * (mobile ? 16 : 28)
      const dx = Math.cos(angle) * speed
      const lift = Math.sin(angle) * speed - (mobile ? 15 : 23)

      return {
        dx,
        lift,
        size: (mobile ? 2.2 : 2.7) + variance * (mobile ? 2.2 : 3.2),
        duration: 720 + variance * 330,
        delay: (index % 4) * 16,
        color: index % 3 === 0 ? accent : color,
      }
    }),
    [accent, color, mobile, particleCount],
  )

  return (
    <div
      className="nowen-impact absolute bottom-[3px] h-px w-px pointer-events-none"
      style={{ left } as React.CSSProperties}
      onAnimationEnd={(event) => {
        if (event.currentTarget === event.target) onComplete()
      }}
    >
      <span
        className="nowen-impact-ring absolute bottom-[-2px] left-0 h-[22px] w-[68px] rounded-full border-2"
        style={{
          borderColor: color,
          boxShadow: `0 0 16px ${color}, inset 0 0 10px ${accent}`,
        }}
      />

      <span
        className="nowen-impact-core absolute bottom-[-3px] left-0 h-[11px] w-[11px] rounded-full"
        style={{
          background: color,
          boxShadow: `0 0 16px ${color}, 0 0 28px ${accent}`,
        }}
      />

      {particles.map((particle, index) => {
        const style: AnimationStyle = {
          width: particle.size,
          height: particle.size * 1.9,
          left: -particle.size / 2,
          bottom: 0,
          background: particle.color,
          boxShadow: `0 0 ${particle.size * 3}px ${particle.color}`,
          animationDuration: `${particle.duration}ms`,
          animationDelay: `${particle.delay}ms`,
          "--drop-x": `${particle.dx}px`,
          "--drop-y": `${particle.lift}px`,
          "--drop-x-end": `${particle.dx * 1.16}px`,
          "--drop-rotate": particle.dx > 0 ? "22deg" : "-22deg",
          "--drop-rotate-end": particle.dx > 0 ? "46deg" : "-46deg",
        }

        return (
          <span
            key={index}
            className="nowen-impact-droplet absolute rounded-full"
            style={style}
          />
        )
      })}
    </div>
  )
})

ImpactDroplets.displayName = "ImpactDroplets"

const BeamEffect = React.memo(({
  beamOptions,
  beamGradient,
  beamShadow,
  paused,
  onCollision,
}: {
  beamOptions: BeamOptions
  beamGradient: string
  beamShadow: string
  paused: boolean
  onCollision: (left: string) => void
}) => {
  const animationStyle: AnimationStyle = {
    left: beamOptions.left,
    width: beamOptions.width,
    height: beamOptions.height,
    background: beamGradient,
    boxShadow: beamShadow,
    animationDuration: `${beamOptions.duration + beamOptions.repeatDelay}s`,
    animationDelay: `${beamOptions.delay}s`,
    animationPlayState: paused ? "paused" : "running",
    "--beam-offset": `${beamOptions.height + 80}px`,
  }

  return (
    <div
      data-testid="beam-streak"
      className="nowen-beam-streak absolute top-0 rounded-full"
      style={animationStyle}
      onAnimationIteration={() => onCollision(beamOptions.left)}
    />
  )
})

BeamEffect.displayName = "BeamEffect"

export default BackgroundBeamsWithCollision
