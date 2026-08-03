import { motion } from 'framer-motion';
import { Typewriter } from '../ui/typewriter';
import { getRandomWisdom, isQuotesVisible } from '../../data/quotes';
import { WeatherDisplay } from './WeatherDisplay';
import { SearchHint } from './SearchHint';
import { WeatherData } from '../../hooks/useWeather';
import '../../styles/ambient-home.css';
import '../../styles/ambient-home-layout.css';

interface HeroSectionProps {
  formattedTime: string;
  formattedDate: string;
  lunarDate: {
    month?: unknown;
    day?: unknown;
    fullDate?: string;
    display?: string;
    festival?: string | null;
    jieQi?: unknown;
  };
  greeting: string;
  isLiteMode?: boolean;
  showWeather?: boolean;
  showLunar?: boolean;
  showSearch?: boolean;
  weather: WeatherData | null;
  weatherLoading?: boolean;
  weatherCity?: string;
  hasWallpaper?: boolean;
  onRefreshWeather: () => void;
  onCityChange?: (city: string) => void;
  onOpenSearch: () => void;
}

const wallpaperTextShadow = {
  primary: { textShadow: '0 2px 18px rgba(0,0,0,0.42), 0 1px 3px rgba(0,0,0,0.55)' },
  secondary: { textShadow: '0 2px 14px rgba(0,0,0,0.34), 0 1px 2px rgba(0,0,0,0.5)' },
  muted: { textShadow: '0 1px 8px rgba(0,0,0,0.36)' },
};

export function HeroSection({
  formattedTime,
  formattedDate,
  lunarDate,
  greeting,
  isLiteMode,
  showWeather,
  showLunar,
  showSearch = true,
  weather,
  weatherLoading,
  weatherCity,
  hasWallpaper,
  onRefreshWeather,
  onCityChange,
  onOpenSearch,
}: HeroSectionProps) {
  const primaryColor = hasWallpaper ? 'rgba(255, 255, 255, 0.96)' : 'var(--color-text-primary)';
  const secondaryColor = hasWallpaper ? 'rgba(255, 255, 255, 0.82)' : 'var(--color-text-secondary)';
  const mutedColor = hasWallpaper ? 'rgba(255, 255, 255, 0.66)' : 'var(--color-text-muted)';

  return (
    <motion.section
      className="ambient-hero relative text-center"
      initial={{ opacity: 0, y: isLiteMode ? 8 : 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: isLiteMode ? 0.45 : 0.68, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.08, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        <div
          className="ambient-hero__time font-mono text-[2.65rem] font-semibold leading-none sm:text-5xl lg:text-[3.4rem]"
          style={{
            color: primaryColor,
            ...(hasWallpaper ? wallpaperTextShadow.primary : {}),
          }}
        >
          {formattedTime}
        </div>

        <div
          className="ambient-hero__meta mt-3 flex flex-wrap items-center justify-center gap-2 text-xs sm:text-sm"
          style={{
            color: mutedColor,
            ...(hasWallpaper ? wallpaperTextShadow.muted : {}),
          }}
        >
          <span>{formattedDate}</span>
          {showLunar && lunarDate.display && (
            <span
              className="rounded-full px-2.5 py-1 text-[11px] tracking-normal"
              style={{
                background:
                  lunarDate.festival || lunarDate.jieQi
                    ? 'rgba(251, 146, 60, 0.14)'
                    : hasWallpaper
                      ? 'rgba(255, 255, 255, 0.14)'
                      : 'var(--color-bg-tertiary)',
                color:
                  lunarDate.festival || lunarDate.jieQi
                    ? 'rgb(251, 146, 60)'
                    : mutedColor,
                border: hasWallpaper
                  ? '1px solid rgba(255,255,255,0.12)'
                  : '1px solid var(--color-border-light)',
              }}
            >
              {lunarDate.display}
            </span>
          )}
        </div>

        {showWeather && weather && (
          <div className="ambient-hero__weather mt-4">
            <WeatherDisplay
              weather={weather}
              loading={Boolean(weatherLoading)}
              onRefresh={onRefreshWeather}
              weatherCity={weatherCity}
              onCityChange={onCityChange}
            />
          </div>
        )}
      </motion.div>

      {isQuotesVisible() && (
        <motion.div
          className="ambient-hero__quote mt-8 flex items-center justify-center px-4 font-serif text-[15px] font-normal sm:text-base"
          style={{
            color: secondaryColor,
            ...(hasWallpaper ? wallpaperTextShadow.secondary : {}),
          }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28, duration: 0.5 }}
          layout
        >
          <Typewriter
            getNextWord={getRandomWisdom}
            initialWord={greeting}
            delayBetweenWords={6500}
            fullSentence
          />
        </motion.div>
      )}

      {showSearch && (
        <div className="ambient-hero__search mt-7 px-3 sm:px-0">
          <SearchHint isLiteMode={Boolean(isLiteMode)} onOpenSearch={onOpenSearch} />
        </div>
      )}
    </motion.section>
  );
}

export default HeroSection;
