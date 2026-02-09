import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  BookMarked,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Clock,
  X,
} from 'lucide-react';
import { Card3D, CardItem } from '../ui/3d-card';
import { Bookmark } from '../../types/bookmark';

interface ReadLaterSectionProps {
  bookmarks: Bookmark[];
  isLiteMode?: boolean;
  onMarkRead?: (id: string) => void;
  onRemove?: (id: string) => void;
}

// 主 Hero 卡片
function HeroBookmark({ 
  bookmark, 
  totalCount,
  isLiteMode,
  onMarkRead,
  onRemove,
}: { 
  bookmark: Bookmark;
  totalCount: number;
  isLiteMode?: boolean;
  onMarkRead?: (id: string) => void;
  onRemove?: (id: string) => void;
}) {
  const { t } = useTranslation();
  const domain = new URL(bookmark.url).hostname.replace('www.', '');
  
  const handleClick = useCallback(() => {
    window.open(bookmark.url, '_blank');
  }, [bookmark.url]);

  const handleMarkRead = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onMarkRead?.(bookmark.id);
  }, [bookmark.id, onMarkRead]);

  const handleRemove = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove?.(bookmark.id);
  }, [bookmark.id, onRemove]);

  // 精简模式
  if (isLiteMode) {
    return (
      <div
        className="group relative p-6 rounded-2xl cursor-pointer transition-all duration-300 hover:shadow-lg overflow-hidden"
        style={{
          background: 'var(--color-glass)',
          border: '1px solid var(--color-glass-border)',
        }}
        onClick={handleClick}
      >
        <div className="flex flex-col md:flex-row gap-5">
          {/* 图片 */}
          {bookmark.ogImage && (
            <div className="w-full md:w-2/5 aspect-[16/10] rounded-xl overflow-hidden flex-shrink-0">
              <img 
                src={bookmark.ogImage} 
                alt="" 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
              />
            </div>
          )}
          
          {/* 内容 */}
          <div className="flex-1 flex flex-col justify-between min-w-0">
            <div>
              {/* 标签行 */}
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-500/15 text-orange-400 text-xs font-medium">
                  <BookMarked className="w-3 h-3" />
                  {t('readLater.title')}
                </span>
                {totalCount > 1 && (
                  <span 
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{ 
                      background: 'var(--color-glass-hover)',
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    +{totalCount - 1} {t('readLater.more')}
                  </span>
                )}
              </div>
              
              {/* 标题 */}
              <h2
                className="text-xl md:text-2xl font-serif font-medium mb-2 line-clamp-2 transition-colors group-hover:text-[var(--color-primary)]"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {bookmark.title}
              </h2>
              
              {/* 描述 */}
              {bookmark.description && (
                <p 
                  className="text-sm line-clamp-2 mb-3"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  {bookmark.description}
                </p>
              )}
              
              {/* 来源和时间 */}
              <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                <span>{domain}</span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(bookmark.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
            
            {/* 操作按钮 */}
            <div className="flex items-center gap-2 mt-4">
              <motion.button
                className="flex-1 md:flex-none px-4 py-2 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                style={{ 
                  background: 'var(--color-glass-hover)',
                  color: 'var(--color-text-secondary)',
                }}
                onClick={handleMarkRead}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <CheckCircle2 className="w-4 h-4" />
                {t('readLater.markRead')}
              </motion.button>
              
              <motion.button
                className="flex-1 md:flex-none px-4 py-2 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-2"
                style={{ 
                  background: 'linear-gradient(135deg, var(--gradient-1), var(--gradient-2))',
                }}
                onClick={handleClick}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {t('readLater.startReading')}
                <ExternalLink className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 完整模式 - 3D 卡片
  return (
    <Card3D className="cursor-pointer" glowColor="rgba(251, 146, 60, 0.3)">
      <div className="relative p-6 md:p-8" onClick={handleClick}>
        {/* 移除按钮 */}
        <motion.button
          className="absolute top-4 right-4 z-20 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ background: 'var(--color-glass-hover)' }}
          onClick={handleRemove}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <X className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
        </motion.button>

        <div className="flex flex-col md:flex-row gap-6">
          {/* 图片区域 */}
          {bookmark.ogImage && (
            <CardItem
              translateZ={30}
              className="w-full md:w-2/5 aspect-[16/10] rounded-xl overflow-hidden flex-shrink-0"
            >
              <img 
                src={bookmark.ogImage} 
                alt="" 
                className="w-full h-full object-cover" 
              />
            </CardItem>
          )}
          
          {/* 内容区域 */}
          <div className="flex-1 flex flex-col justify-between min-w-0">
            <div>
              {/* 标签行 */}
              <CardItem translateZ={40}>
                <div className="flex items-center gap-2 mb-4">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/15 text-orange-400 text-xs font-medium">
                    <BookMarked className="w-3 h-3" />
                    {t('readLater.title')}
                  </span>
                  {totalCount > 1 && (
                    <span 
                      className="text-xs px-2.5 py-1 rounded-full"
                      style={{ 
                        background: 'var(--color-glass-hover)',
                        color: 'var(--color-text-muted)',
                      }}
                    >
                      +{totalCount - 1} {t('readLater.more')}
                    </span>
                  )}
                </div>
              </CardItem>
              
              {/* 标题 */}
              <CardItem translateZ={50}>
                <h2
                  className="text-2xl md:text-3xl font-serif font-medium mb-3 line-clamp-2"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {bookmark.title}
                </h2>
              </CardItem>
              
              {/* 描述 */}
              {bookmark.description && (
                <CardItem translateZ={30}>
                  <p 
                    className="line-clamp-2 mb-4"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    {bookmark.description}
                  </p>
                </CardItem>
              )}
              
              {/* 来源和时间 */}
              <CardItem translateZ={20}>
                <div className="flex items-center gap-3 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  <span>{domain}</span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(bookmark.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </CardItem>
            </div>
            
            {/* 操作按钮 */}
            <CardItem translateZ={40} className="mt-6">
              <div className="flex items-center gap-3">
                <motion.button
                  className="px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors"
                  style={{ 
                    background: 'var(--color-glass-hover)',
                    color: 'var(--color-text-secondary)',
                  }}
                  onClick={handleMarkRead}
                  whileHover={{ scale: 1.02, background: 'var(--color-glass-active)' }}
                  whileTap={{ scale: 0.98 }}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {t('readLater.markRead')}
                </motion.button>
                
                <motion.button
                  className="px-5 py-2.5 rounded-xl text-sm font-medium text-white flex items-center gap-2"
                  style={{ 
                    background: 'linear-gradient(135deg, var(--gradient-1), var(--gradient-2))',
                  }}
                  onClick={handleClick}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {t('readLater.startReading')}
                  <ExternalLink className="w-4 h-4" />
                </motion.button>
              </div>
            </CardItem>
          </div>
        </div>
      </div>
    </Card3D>
  );
}

// 列表项组件
function ListItem({ 
  bookmark, 
  index,
  onMarkRead,
  onRemove,
  onClick,
}: { 
  bookmark: Bookmark;
  index: number;
  onMarkRead?: (id: string) => void;
  onRemove?: (id: string) => void;
  onClick?: () => void;
}) {
  const { t } = useTranslation();
  const domain = new URL(bookmark.url).hostname.replace('www.', '');

  return (
    <motion.div
      className="group flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all"
      style={{
        background: 'var(--color-glass)',
        border: '1px solid var(--color-glass-border)',
      }}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ 
        background: 'var(--color-glass-hover)',
        x: 4,
      }}
      onClick={onClick}
    >
      {/* 缩略图 */}
      {bookmark.ogImage ? (
        <div className="w-16 h-12 rounded-lg overflow-hidden flex-shrink-0">
          <img 
            src={bookmark.ogImage} 
            alt="" 
            className="w-full h-full object-cover" 
          />
        </div>
      ) : (
        <div 
          className="w-16 h-12 rounded-lg flex-shrink-0 flex items-center justify-center"
          style={{ background: 'var(--color-glass-hover)' }}
        >
          <BookMarked className="w-5 h-5" style={{ color: 'var(--color-text-muted)' }} />
        </div>
      )}
      
      {/* 内容 */}
      <div className="flex-1 min-w-0">
        <h4 
          className="font-medium text-sm line-clamp-1 mb-1"
          style={{ color: 'var(--color-text-primary)' }}
        >
          {bookmark.title}
        </h4>
        <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
          <span>{domain}</span>
          <span>·</span>
          <span>{new Date(bookmark.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
      
      {/* 操作按钮 */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto">
        <motion.button
          className="p-2 rounded-lg transition-colors hover:bg-[var(--color-glass-hover)]"
          style={{ color: 'var(--color-text-muted)' }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onMarkRead?.(bookmark.id);
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          title={t('readLater.markRead')}
        >
          <CheckCircle2 className="w-4 h-4" />
        </motion.button>
        <motion.button
          className="p-2 rounded-lg transition-colors hover:bg-[var(--color-glass-hover)]"
          style={{ color: 'var(--color-text-muted)' }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove?.(bookmark.id);
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          title={t('readLater.remove')}
        >
          <X className="w-4 h-4" />
        </motion.button>
      </div>
      
      {/* 箭头指示 */}
      <ChevronRight 
        className="w-4 h-4 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" 
        style={{ color: 'var(--color-text-muted)' }}
      />
    </motion.div>
  );
}

// 主组件
export function ReadLaterSection({ 
  bookmarks, 
  isLiteMode,
  onMarkRead,
  onRemove,
}: ReadLaterSectionProps) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  
  // 过滤未读的稍后阅读书签
  const unreadBookmarks = bookmarks.filter(b => b.isReadLater && !b.isRead);
  
  // 如果没有稍后阅读书签，直接隐藏整个区域
  if (unreadBookmarks.length === 0) {
    return null;
  }
  
  const heroBookmark = unreadBookmarks[0];
  const restBookmarks = unreadBookmarks.slice(1);
  const hasMore = restBookmarks.length > 0;
  // 默认收起时不显示列表，展开时显示全部
  const displayRestBookmarks = isExpanded ? restBookmarks : [];
  const hiddenCount = restBookmarks.length;

  return (
    <motion.section
      className="mb-12"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8 }}
    >
      {/* Hero 卡片 */}
      <HeroBookmark
        bookmark={heroBookmark}
        totalCount={unreadBookmarks.length}
        isLiteMode={isLiteMode}
        onMarkRead={onMarkRead}
        onRemove={onRemove}
      />
      
      {/* 更多列表 */}
      <AnimatePresence>
        {hasMore && (
          <motion.div
            className="mt-4 space-y-2"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            {/* 分隔标题 - 点击展开/收起 */}
            <motion.button
              className="w-full flex items-center gap-3 py-2 group"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <div className="flex-1 h-px transition-colors group-hover:bg-[var(--color-glass-hover)]" style={{ background: 'var(--color-glass-border)' }} />
              <div
                className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full transition-all group-hover:bg-[var(--color-glass-hover)]"
                style={{ 
                  background: 'var(--color-glass)',
                  color: 'var(--color-text-muted)',
                }}
              >
                <span>
                  {isExpanded 
                    ? t('readLater.collapse', { count: restBookmarks.length })
                    : t('readLater.moreToRead', { count: restBookmarks.length })
                  }
                </span>
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </motion.div>
              </div>
              <div className="flex-1 h-px transition-colors group-hover:bg-[var(--color-glass-hover)]" style={{ background: 'var(--color-glass-border)' }} />
            </motion.button>
            
            {/* 列表 - 展开时显示 */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div 
                  className="space-y-2"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {displayRestBookmarks.map((bookmark, index) => (
                    <ListItem
                      key={bookmark.id}
                      bookmark={bookmark}
                      index={index}
                      onMarkRead={onMarkRead}
                      onRemove={onRemove}
                      onClick={() => window.open(bookmark.url, '_blank')}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}

export default ReadLaterSection;
