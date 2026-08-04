import React, { Children, cloneElement, isValidElement, useMemo, useState } from 'react'
import { Activity, Boxes, ChevronDown, ChevronUp, Cpu, Wifi } from 'lucide-react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { cn } from '../../lib/utils'
import { SpotlightCard } from './spotlight-card'
import '../../styles/system-workspace.css'

interface BentoGridProps {
  children: React.ReactNode
  className?: string
}

type WorkspaceRole =
  | 'system-monitor'
  | 'hardware-specs'
  | 'vital-signs'
  | 'network-telemetry'
  | 'process-matrix'

const WORKSPACE_ROLES: WorkspaceRole[] = [
  'system-monitor',
  'hardware-specs',
  'vital-signs',
  'network-telemetry',
  'process-matrix',
]

const WORKSPACE_COLLAPSED_KEY = 'nowen-system-workspace-collapsed-v1'

function getWorkspaceRole(node: React.ReactNode): WorkspaceRole | null {
  if (!isValidElement(node)) return null
  const key = String(node.key ?? '')
  return WORKSPACE_ROLES.find((role) => key.includes(role)) ?? null
}

function loadWorkspaceCollapsed() {
  try {
    const stored = localStorage.getItem(WORKSPACE_COLLAPSED_KEY)
    return stored === null ? true : stored === 'true'
  } catch {
    return true
  }
}

export function BentoGrid({ children, className }: BentoGridProps) {
  const { t } = useTranslation()
  const [workspaceCollapsed, setWorkspaceCollapsed] = useState(loadWorkspaceCollapsed)
  const childEntries = useMemo(
    () => Children.toArray(children).map((node) => ({ node, role: getWorkspaceRole(node) })),
    [children],
  )
  const workspaceEntries = childEntries.filter((entry) => entry.role)
  const contentEntries = childEntries.filter((entry) => !entry.role)

  if (workspaceEntries.length === 0) {
    return (
      <div
        className={cn(
          'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 auto-rows-[minmax(60px,auto)]',
          className,
        )}
      >
        {children}
      </div>
    )
  }

  const summaryItems = [
    {
      id: 'runtime',
      label: t('monitor.workspace_runtime', '运行状态'),
      icon: Activity,
      visible: workspaceEntries.some(({ role }) => role === 'system-monitor' || role === 'vital-signs'),
    },
    {
      id: 'network',
      label: t('monitor.workspace_network', '网络'),
      icon: Wifi,
      visible: workspaceEntries.some(({ role }) => role === 'network-telemetry'),
    },
    {
      id: 'services',
      label: t('monitor.workspace_services', '服务'),
      icon: Boxes,
      visible: workspaceEntries.some(({ role }) => role === 'process-matrix'),
    },
    {
      id: 'device',
      label: t('monitor.workspace_device', '设备'),
      icon: Cpu,
      visible: workspaceEntries.some(({ role }) => role === 'hardware-specs'),
    },
  ].filter((item) => item.visible)

  const toggleWorkspace = () => {
    setWorkspaceCollapsed((previous) => {
      const next = !previous
      try {
        localStorage.setItem(WORKSPACE_COLLAPSED_KEY, String(next))
      } catch {
        // Persistence is optional; the interaction still works.
      }
      return next
    })
  }

  return (
    <div className={cn('system-workspace-stack', className)} data-testid="system-workspace-stack">
      <section className="system-workspace" aria-labelledby="system-workspace-title">
        <header className="system-workspace__header">
          <div className="system-workspace__heading">
            <span className="system-workspace__heading-icon" aria-hidden="true">
              <Activity className="h-4 w-4" />
            </span>
            <div>
              <div className="system-workspace__title-row">
                <h3 id="system-workspace-title">
                  {t('monitor.workspace_title', '系统工作台')}
                </h3>
                <span className="system-workspace__live">
                  <span aria-hidden="true" />
                  {t('monitor.workspace_live', '实时')}
                </span>
              </div>
              <p>
                {t(
                  'monitor.workspace_description',
                  '聚合设备、网络与服务状态，需要时再展开详细面板',
                )}
              </p>
            </div>
          </div>

          <div className="system-workspace__summary" role="list" aria-label={t('monitor.workspace_summary', '状态摘要')}>
            {summaryItems.map(({ id, label, icon: Icon }) => (
              <span key={id} className="system-workspace__summary-item" role="listitem">
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{label}</span>
                <i aria-hidden="true" />
              </span>
            ))}
          </div>

          <button
            type="button"
            className="system-workspace__toggle"
            aria-expanded={!workspaceCollapsed}
            aria-controls="system-workspace-modules"
            onClick={toggleWorkspace}
          >
            <span>
              {workspaceCollapsed
                ? t('monitor.workspace_expand', '展开详情')
                : t('monitor.workspace_collapse', '收起详情')}
            </span>
            {workspaceCollapsed ? (
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
            ) : (
              <ChevronUp className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </header>

        {!workspaceCollapsed && (
          <div id="system-workspace-modules" className="system-workspace__grid">
            {workspaceEntries.map(({ node, role }) => {
              if (!isValidElement<BentoGridItemProps>(node) || !role) return node
              return cloneElement(node, {
                workspaceItem: true,
                workspaceRole: role,
              })
            })}
          </div>
        )}
      </section>

      {contentEntries.length > 0 && (
        <section className="system-shortcuts" aria-labelledby="system-shortcuts-title">
          <div className="system-shortcuts__header">
            <div>
              <h3 id="system-shortcuts-title">
                {t('monitor.shortcuts_title', '常用入口')}
              </h3>
              <p>{t('monitor.shortcuts_description', '快速打开固定的常用书签')}</p>
            </div>
            <span>{contentEntries.length}</span>
          </div>
          <div className="system-shortcuts__grid">
            {contentEntries.map(({ node }) => node)}
          </div>
        </section>
      )}
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
  onContextMenu?: (e: React.MouseEvent) => void
  delay?: number
  workspaceItem?: boolean
  workspaceRole?: WorkspaceRole
}

export function BentoGridItem({
  children,
  className,
  colSpan = 1,
  rowSpan = 1,
  spotlightColor,
  onClick,
  onContextMenu,
  delay = 0,
  workspaceItem = false,
  workspaceRole,
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

  if (workspaceItem) {
    return (
      <div
        className={cn('system-workspace__module', workspaceRole && `system-workspace__module--${workspaceRole}`)}
        data-workspace-role={workspaceRole}
      >
        <SpotlightCard
          lightweight
          className={cn('system-workspace__card h-full !p-0', className)}
          spotlightColor={spotlightColor}
          onClick={onClick}
          onContextMenu={onContextMenu}
        >
          {children}
        </SpotlightCard>
      </div>
    )
  }

  return (
    <motion.div
      className={cn(colSpanClasses[colSpan], rowSpanClasses[rowSpan])}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: 'easeOut' }}
    >
      <SpotlightCard
        lightweight
        className={cn('h-full', className)}
        spotlightColor={spotlightColor}
        onClick={onClick}
        onContextMenu={onContextMenu}
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div
          className="lg:col-span-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <SpotlightCard lightweight className="h-full min-h-[200px]" size="lg">
            {heroContent}
          </SpotlightCard>
        </motion.div>

        {sideContent && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            <SpotlightCard lightweight className="h-full min-h-[200px]" size="lg">
              {sideContent}
            </SpotlightCard>
          </motion.div>
        )}
      </div>

      <BentoGrid>{gridItems}</BentoGrid>
    </div>
  )
}
