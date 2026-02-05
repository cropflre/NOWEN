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
  onRefreshWeather: () => void;
  onOpenSearch: () => void;
}

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
  onRefreshWeather,
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
          style={{ color: 'var(--color-text-primary)' }}
        >
          {formattedTime}
        </div>
        <div
          className="text-base tracking-[0.2em] uppercase mt-3 flex flex-wrap items-center justify-center gap-2"
          style={{ color: 'var(--color-text-muted)' }}
        >
          <span>{formattedDate}</span>
          {showLunar && lunarDate.display && (
            <span
              className="px-2 py-0.5 rounded-md text-sm normal-case tracking-normal"
              style={{
                background:
                  lunarDate.festival || lunarDate.jieQi
                    ? 'rgba(251, 146, 60, 0.15)'
                    : 'var(--color-bg-tertiary)',
                color:
                  lunarDate.festival || lunarDate.jieQi
                    ? 'rgb(251, 146, 60)'
                    : 'var(--color-text-muted)',
              }}
            >
              {lunarDate.display}
            </span>
          )}
        </div>

        {/* 天气显示 */}
        {showWeather && weather && (
          <WeatherDisplay weather={weather} loading={weatherLoading} onRefresh={onRefreshWeather} />
        )}
      </motion.div>

      {/* Greeting with Typewriter */}
      <motion.h1
        className="text-base sm:text-lg lg:text-xl font-serif font-medium mb-8 tracking-wide min-h-[3.5em] flex items-center justify-center"
        style={{ color: 'var(--color-text-secondary)' }}
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
