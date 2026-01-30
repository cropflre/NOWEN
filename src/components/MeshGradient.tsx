import { motion } from 'framer-motion'
import { cn } from '../lib/utils'

interface MeshGradientProps {
  className?: string
}

export function MeshGradient({ className }: MeshGradientProps) {
  return (
    <div className={cn('fixed inset-0 -z-10', className)}>
      {/* 主渐变背景 */}
      <div className="absolute inset-0 mesh-gradient opacity-60" />
      
      {/* 浮动光球 */}
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full opacity-30"
        style={{
          background: 'radial-gradient(circle, rgba(102,126,234,0.4) 0%, transparent 70%)',
          top: '10%',
          left: '20%',
        }}
        animate={{
          x: [0, 100, 0],
          y: [0, 50, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full opacity-25"
        style={{
          background: 'radial-gradient(circle, rgba(118,75,162,0.4) 0%, transparent 70%)',
          top: '50%',
          right: '10%',
        }}
        animate={{
          x: [0, -80, 0],
          y: [0, -60, 0],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full opacity-20"
        style={{
          background: 'radial-gradient(circle, rgba(240,147,251,0.3) 0%, transparent 70%)',
          bottom: '10%',
          left: '30%',
        }}
        animate={{
          x: [0, 60, 0],
          y: [0, -40, 0],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* 噪点纹理 */}
      <div className="noise absolute inset-0" />
      
      {/* 暗化覆盖层 - 让内容更清晰 */}
      <div className="absolute inset-0 bg-black/30 dark:bg-black/50" />
    </div>
  )
}
