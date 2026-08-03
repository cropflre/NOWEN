import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Search, Command, ArrowUpRight } from 'lucide-react';

interface SearchHintProps {
  isLiteMode: boolean;
  onOpenSearch: () => void;
}

export function SearchHint({ isLiteMode, onOpenSearch }: SearchHintProps) {
  const { t } = useTranslation();

  return (
    <motion.button
      type="button"
      data-ambient-control="true"
      className="group flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left transition-all duration-300 sm:px-5"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.45 }}
      whileHover={isLiteMode ? undefined : { y: -2, scale: 1.005 }}
      whileTap={{ scale: 0.99 }}
      onClick={onOpenSearch}
      aria-label={t('search_placeholder')}
    >
      <span
        className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl transition-transform duration-300 group-hover:scale-105"
        style={{
          color: 'var(--color-primary)',
          background: 'color-mix(in srgb, var(--color-primary) 10%, transparent)',
          border: '1px solid color-mix(in srgb, var(--color-primary) 12%, transparent)',
        }}
      >
        <Search className="h-4 w-4" />
      </span>

      <span className="min-w-0 flex-1">
        <span
          className="block truncate text-sm font-medium sm:text-[15px]"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {t('search_placeholder')}
        </span>
        <span
          className="mt-0.5 hidden text-[11px] sm:block"
          style={{ color: 'var(--color-text-muted)' }}
        >
          搜索书签、标签，或直接输入网址
        </span>
      </span>

      <kbd
        className="hidden items-center gap-1 rounded-lg px-2 py-1 text-[11px] sm:flex"
        style={{
          background: 'var(--color-bg-tertiary)',
          color: 'var(--color-text-muted)',
          border: '1px solid var(--color-border-light)',
        }}
      >
        <Command className="h-3 w-3" /> K
      </kbd>

      <ArrowUpRight
        className="h-4 w-4 flex-shrink-0 opacity-40 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-70"
        style={{ color: 'var(--color-text-muted)' }}
      />
    </motion.button>
  );
}

export default SearchHint;
