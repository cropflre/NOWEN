import React from 'react';
import { motion } from 'framer-motion';
import { Bookmark as BookmarkIcon } from 'lucide-react';
import { Sparkles } from '../ui/effects';

interface EmptyStateProps {
  isLiteMode?: boolean;
  onAddBookmark: () => void;
}

export function EmptyState({ isLiteMode, onAddBookmark }: EmptyStateProps) {
  return (
    <motion.div
      className="text-center py-20"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
    >
      <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-nebula-purple/20 to-nebula-pink/20 flex items-center justify-center">
        {isLiteMode ? (
          <BookmarkIcon className="w-10 h-10" style={{ color: 'var(--color-text-muted)' }} />
        ) : (
          <Sparkles>
            <BookmarkIcon className="w-10 h-10" style={{ color: 'var(--color-text-muted)' }} />
          </Sparkles>
        )}
      </div>
      <h3 className="text-2xl font-serif mb-4" style={{ color: 'var(--color-text-primary)' }}>
        开启你的星云之旅
      </h3>
      <p className="mb-8 max-w-md mx-auto" style={{ color: 'var(--color-text-secondary)' }}>
        按{' '}
        <kbd className="px-2 py-1 rounded text-xs" style={{ background: 'var(--color-bg-tertiary)' }}>
          ⌘K
        </kbd>{' '}
        打开命令面板， 粘贴链接即可添加第一个书签
      </p>
      <motion.button
        onClick={onAddBookmark}
        className="px-8 py-4 rounded-2xl bg-gradient-to-r from-nebula-purple to-nebula-pink text-white font-medium shadow-glow-md"
        whileHover={{ scale: isLiteMode ? 1.02 : 1.05 }}
        whileTap={{ scale: isLiteMode ? 0.98 : 0.95 }}
      >
        添加第一个书签
      </motion.button>
    </motion.div>
  );
}

export default EmptyState;
