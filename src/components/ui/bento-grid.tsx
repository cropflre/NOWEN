import { cn } from '../../lib/utils'
import { motion } from 'framer-motion'

interface BentoGridProps {
  children: React.ReactNode
  className?: string
}

export function BentoGrid({ children, className }: BentoGridProps) {
  return (
    <div
      className={cn(
        'grid gap-4 auto-rows-[minmax(180px,auto)]',
        'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
        className
      )}
    >
      {children}
    </div>
  )
}

interface BentoGridItemProps {
  children: React.ReactNode
  className?: string
  colSpan?: 1 | 2
  rowSpan?: 1 | 2
  onClick?: () => void
}

export function BentoGridItem({
  children,
  className,
  colSpan = 1,
  rowSpan = 1,
  onClick,
}: BentoGridItemProps) {
  return (
    <motion.div
      className={cn(
        'relative group rounded-2xl overflow-hidden',
        'bg-[#0d0d14]/80 backdrop-blur-xl',
        'border border-white/5 hover:border-white/10',
        'transition-all duration-500',
        colSpan === 2 && 'sm:col-span-2',
        rowSpan === 2 && 'row-span-2',
        className
      )}
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ 
        scale: 1.02,
        transition: { duration: 0.3 }
      }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Hover Glow */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-nebula-purple/10 via-transparent to-nebula-pink/10" />
      </div>

      {/* Animated Border */}
      <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
        <div 
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(102, 126, 234, 0.3), transparent)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 2s linear infinite',
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full p-6">
        {children}
      </div>
    </motion.div>
  )
}
