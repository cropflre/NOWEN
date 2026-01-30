import { motion } from 'framer-motion'
import { cn } from '../../lib/utils'
import { SpotlightCard } from './spotlight-card'

interface BentoGridProps {
  children: React.ReactNode
  className?: string
}

export function BentoGrid({ children, className }: BentoGridProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 auto-rows-[minmax(120px,auto)]',
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
  colSpan?: 1 | 2 | 3 | 4
  rowSpan?: 1 | 2 | 3
  spotlightColor?: string
  onClick?: () => void
  delay?: number
}

export function BentoGridItem({
  children,
  className,
  colSpan = 1,
  rowSpan = 1,
  spotlightColor,
  onClick,
  delay = 0,
}: BentoGridItemProps) {
  const colSpanClasses = {
    1: 'col-span-1',
    2: 'col-span-1 md:col-span-2',
    3: 'col-span-2 md:col-span-3',
    4: 'col-span-2 md:col-span-4',
  }

  const rowSpanClasses = {
    1: 'row-span-1',
    2: 'row-span-2',
    3: 'row-span-3',
  }

  return (
    <motion.div
      className={cn(colSpanClasses[colSpan], rowSpanClasses[rowSpan])}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: 'easeOut' }}
    >
      <SpotlightCard
        className={cn('h-full', className)}
        spotlightColor={spotlightColor}
        onClick={onClick}
      >
        {children}
      </SpotlightCard>
    </motion.div>
  )
}

// 预设的 Bento 布局模板
export function BentoHeroLayout({
  heroContent,
  sideContent,
  gridItems,
}: {
  heroContent: React.ReactNode
  sideContent?: React.ReactNode
  gridItems: React.ReactNode[]
}) {
  return (
    <div className="space-y-4">
      {/* Top Row - Hero + Side */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div
          className="lg:col-span-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <SpotlightCard className="h-full min-h-[200px]" size="lg">
            {heroContent}
          </SpotlightCard>
        </motion.div>
        
        {sideContent && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            <SpotlightCard className="h-full min-h-[200px]" size="lg">
              {sideContent}
            </SpotlightCard>
          </motion.div>
        )}
      </div>

      {/* Grid Items */}
      <BentoGrid>
        {gridItems}
      </BentoGrid>
    </div>
  )
}
