import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Search, Command } from 'lucide-react';
import { Button as MovingBorderButton } from '../ui/moving-border';

interface SearchHintProps {
  isLiteMode: boolean;
  onOpenSearch: () => void;
}

export function SearchHint({ isLiteMode, onOpenSearch }: SearchHintProps) {
  const { t } = useTranslation();

  return (
    <motion.div
      className="relative inline-block"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      whileHover={{ y: isLiteMode ? 0 : -2 }}
    >
      {isLiteMode ? (
        // 精简模式：简约搜索框，无 Moving Border
        <div
          className="inline-flex items-center gap-3 px-6 py-3.5 rounded-xl cursor-pointer transition-all duration-300 hover:shadow-md"
          style={{
            background: 'var(--color-glass)',
            border: '1px solid var(--color-glass-border)',
          }}
          onClick={onOpenSearch}
        >
          <Search className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
          <span className="tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
            {t('search_placeholder')}
          </span>
          <kbd
            className="px-2 py-1 rounded text-xs flex items-center gap-1 ml-2"
            style={{
              background: 'var(--color-bg-tertiary)',
              color: 'var(--color-text-muted)',
              border: '1px solid var(--color-border-light)',
            }}
          >
            <Command className="w-3 h-3" /> K
          </kbd>
        </div>
      ) : (
        // 完整模式：Moving Border 搜索框
        <MovingBorderButton
          borderRadius="1rem"
          duration={3000}
          containerClassName="cursor-pointer"
          borderClassName="bg-[radial-gradient(var(--color-primary)_40%,transparent_60%)]"
          className="bg-[var(--color-glass)] dark:bg-slate-900/[0.8] border-[var(--color-glass-border)] dark:border-slate-800 px-6 py-3.5 gap-3"
          onClick={onOpenSearch}
        >
          <Search
            className="w-4 h-4 transition-colors group-hover:text-[var(--color-primary)]"
            style={{ color: 'var(--color-text-muted)' }}
          />
          <span className="tracking-wide transition-colors" style={{ color: 'var(--color-text-muted)' }}>
            {t('search_placeholder')}
          </span>
          <kbd
            className="px-2 py-1 rounded text-xs flex items-center gap-1 ml-2"
            style={{
              background: 'var(--color-bg-tertiary)',
              color: 'var(--color-text-muted)',
              border: '1px solid var(--color-border-light)',
            }}
          >
            <Command className="w-3 h-3" /> K
          </kbd>
        </MovingBorderButton>
      )}
    </motion.div>
  );
}

export default SearchHint;
