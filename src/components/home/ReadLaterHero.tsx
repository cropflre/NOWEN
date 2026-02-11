import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ExternalLink, BookMarked } from 'lucide-react';
import { Card3D, CardItem } from '../ui/3d-card';
import { Bookmark } from '../../types/bookmark';
import { visitsApi } from '../../lib/api';
import { useNetworkEnv, getBookmarkUrl } from '../../hooks/useNetworkEnv';

interface ReadLaterHeroProps {
  bookmark: Bookmark;
  isLiteMode?: boolean;
}

export function ReadLaterHero({ bookmark, isLiteMode }: ReadLaterHeroProps) {
  const { t } = useTranslation();
  const { isInternal } = useNetworkEnv();

  const handleClick = () => {
    visitsApi.track(bookmark.id).catch(console.error);
    window.open(getBookmarkUrl(bookmark, isInternal), '_blank');
  };

  if (isLiteMode) {
    // 精简模式：普通卡片，无 3D 效果
    return (
      <motion.section
        className="mb-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <div
          className="p-8 rounded-2xl cursor-pointer transition-all duration-300 hover:shadow-lg"
          style={{
            background: 'var(--color-glass)',
            border: '1px solid var(--color-glass-border)',
          }}
          onClick={handleClick}
        >
          <div className="flex flex-col md:flex-row gap-6">
            {bookmark.ogImage && (
              <div className="w-full md:w-1/3 aspect-video rounded-xl overflow-hidden">
                <img src={bookmark.ogImage} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-xs font-medium mb-4">
                  <BookMarked className="w-3 h-3" />
                  {t('bookmark.read_later')}
                </span>
                <h2
                  className="text-2xl md:text-3xl font-serif font-medium mb-3 line-clamp-2"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {bookmark.title}
                </h2>
                {bookmark.description && (
                  <p className="line-clamp-2" style={{ color: 'var(--color-text-secondary)' }}>
                    {bookmark.description}
                  </p>
                )}
              </div>
              <div className="mt-6 flex items-center justify-between">
                <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  {new URL(bookmark.url).hostname}
                </span>
                <span
                  className="flex items-center gap-2 text-sm"
                  style={{ color: 'var(--color-primary)' }}
                >
                  {t('bookmark.visit')} <ExternalLink className="w-4 h-4" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.section>
    );
  }

  // 完整模式：3D 卡片
  return (
    <motion.section
      className="mb-12"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8 }}
    >
      <Card3D className="cursor-pointer" glowColor="rgba(251, 146, 60, 0.4)">
        <div className="p-8 flex flex-col md:flex-row gap-6" onClick={handleClick}>
          {bookmark.ogImage && (
            <CardItem
              translateZ={30}
              className="w-full md:w-1/3 aspect-video rounded-xl overflow-hidden"
            >
              <img src={bookmark.ogImage} alt="" className="w-full h-full object-cover" />
            </CardItem>
          )}
          <div className="flex-1 flex flex-col justify-between">
            <div>
              <CardItem translateZ={40}>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-xs font-medium mb-4">
                  <BookMarked className="w-3 h-3" />
                  {t('bookmark.read_later')}
                </span>
              </CardItem>
              <CardItem translateZ={50}>
                <h2
                  className="text-2xl md:text-3xl font-serif font-medium mb-3 line-clamp-2"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {bookmark.title}
                </h2>
              </CardItem>
              {bookmark.description && (
                <CardItem translateZ={30}>
                  <p className="line-clamp-2" style={{ color: 'var(--color-text-secondary)' }}>
                    {bookmark.description}
                  </p>
                </CardItem>
              )}
            </div>
            <CardItem translateZ={20} className="mt-6">
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  {new URL(bookmark.url).hostname}
                </span>
                <span
                  className="flex items-center gap-2 text-sm"
                  style={{ color: 'var(--color-primary)' }}
                >
                  {t('bookmark.visit')} <ExternalLink className="w-4 h-4" />
                </span>
              </div>
            </CardItem>
          </div>
        </div>
      </Card3D>
    </motion.section>
  );
}

export default ReadLaterHero;
