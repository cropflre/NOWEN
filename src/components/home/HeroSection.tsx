import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Sparkles } from '../ui/effects';
import { Typewriter } from '../ui/typewriter';
import { getRandomWisdom } from '../../data/quotes';
import { WeatherDisplay } from './WeatherDisplay';
import { SearchHint } from './SearchHint';
import { WeatherData } from '../../hooks/useWeather';

interface HeroSectionProps {
  formattedTime: string;
  formattedDate: string;
  lunarDate: {
    month?: any;
    day?: any;
    fullDate?: string;
    display?: string;
    festival?: string | null;
    jieQi?: any;
  };
  greeting: string;
  isLiteMode?: boolean;
  showWeather?: boolean;
  showLunar?: boolean;
  weather: WeatherData | null;
  weatherLoading?: boolean;
  weatherCity?: string;
  hasWallpaper?: boolean;
  onRefreshWeather: () => void;
  onCityChange?: (city: string) => void;
  onOpenSearch: () => void;
}

// A11y: 壁纸模式下的文字阴影样式 - 提升对比度确保可读性
const wallpaperTextShadow = {
  primary: { textShadow: '0 1px 3px rgba(0,0,0,0.8), 0 0 12px rgba(0,0,0,0.4)' },
  secondary: { textShadow: '0 1px 3px rgba(0,0,0,0.7), 0 0 10px rgba(0,0,0,0.35)' },
  muted: { textShadow: '0 1px 2px rgba(0,0,0,0.6), 0 0 8px rgba(0,0,0,0.3)' },
};

export function HeroSection({
  formattedTime,
  formattedDate,
  lunarDate,
  greeting,
  isLiteMode,
  showWeather,
  showLunar,
  weather,
  weatherLoading,
  weatherCity,
  hasWallpaper,
  onRefreshWeather,
  onCityChange,
  onOpenSearch,
}: HeroSectionProps) {
  return (
    <motion.section
      className="pt-20 pb-16 text-center relative"
      initial={{ opacity: 0, y: isLiteMode ? 10 : 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: isLiteMode ? 0.5 : 0.8 }}
    >
      {/* Time Display */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div
          className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tighter font-mono"
          style={{ color: hasWallpaper ? 'rgba(255, 255, 255, 0.95)' : 'var(--color-text-primary)', ...(hasWallpaper ? wallpaperTextShadow.primary : {}) }}
        >
          {formattedTime}
        </div>
        <div
          className="text-base tracking-[0.2em] uppercase mt-3 flex flex-wrap items-center justify-center gap-2"
          style={{ color: hasWallpaper ? 'rgba(255, 255, 255, 0.7)' : 'var(--color-text-muted)', ...(hasWallpaper ? wallpaperTextShadow.muted : {}) }}
        >
          <span>{formattedDate}</span>
          {showLunar && lunarDate.display && (
            <span
              className="px-2 py-0.5 rounded-md text-sm normal-case tracking-normal"
              style={{
                background:
                  lunarDate.festival || lunarDate.jieQi
                    ? 'rgba(251, 146, 60, 0.15)'
                    : hasWallpaper ? 'rgba(255, 255, 255, 0.15)' : 'var(--color-bg-tertiary)',
                color:
                  lunarDate.festival || lunarDate.jieQi
                    ? 'rgb(251, 146, 60)'
                    : hasWallpaper ? 'rgba(255, 255, 255, 0.85)' : 'var(--color-text-muted)',
                ...(hasWallpaper ? wallpaperTextShadow.muted : {}),
              }}
            >
              {lunarDate.display}
            </span>
          )}
        </div>

        {/* 天气显示 */}
        {showWeather && weather && (
          <WeatherDisplay weather={weather} loading={weatherLoading} onRefresh={onRefreshWeather} weatherCity={weatherCity} onCityChange={onCityChange} />
        )}
      </motion.div>

      {/* Greeting with Typewriter */}
      <motion.h1
        className="text-base sm:text-lg lg:text-xl font-serif font-medium mb-8 tracking-wide min-h-[3.5em] flex items-center justify-center"
        style={{ 
          color: hasWallpaper ? 'rgba(255, 255, 255, 0.95)' : 'var(--color-text-secondary)',
          ...(hasWallpaper ? wallpaperTextShadow.secondary : {}),
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        layout
      >
        {isLiteMode ? (
          // 精简模式：静态文字，无 Sparkles 特效
          <Typewriter
            getNextWord={getRandomWisdom}
            initialWord={greeting}
            delayBetweenWords={5000}
            fullSentence
          />
        ) : (
          <Sparkles>
            <Typewriter
              getNextWord={getRandomWisdom}
              initialWord={greeting}
              delayBetweenWords={5000}
              fullSentence
            />
          </Sparkles>
        )}
      </motion.h1>

      {/* Search Hint */}
      <SearchHint isLiteMode={isLiteMode} onOpenSearch={onOpenSearch} />
    </motion.section>
  );
}

export default HeroSection;
