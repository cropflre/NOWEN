import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Droplets, Wind, RefreshCw, Navigation, X, Check, ChevronDown, Thermometer, Umbrella, Sunrise, Sunset } from 'lucide-react';
import { WeatherData, DailyForecast, getWeatherIcon } from '../../hooks/useWeather';
import { useTranslation } from 'react-i18next';

interface WeatherDisplayProps {
  weather: WeatherData | null;
  loading: boolean;
  onRefresh: () => void;
  weatherCity?: string;
  onCityChange?: (city: string) => void;
}

export function WeatherDisplay({ weather, loading, onRefresh, weatherCity, onCityChange }: WeatherDisplayProps) {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [cityInput, setCityInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  // 点击外部关闭预报面板
  useEffect(() => {
    if (!isExpanded) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsExpanded(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isExpanded]);

  if (!weather) return null;

  const handleCityClick = () => {
    if (!onCityChange) return;
    setCityInput(weatherCity || '');
    setIsEditing(true);
  };

  const handleConfirm = () => {
    const trimmed = cityInput.trim();
    onCityChange?.(trimmed);
    setIsEditing(false);
  };

  const handleUseLocation = () => {
    onCityChange?.('');
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleConfirm();
    if (e.key === 'Escape') setIsEditing(false);
  };

  // 计算温度条在 7 天范围内的位置
  const allTemps = weather.forecast.map(d => [d.tempMin, d.tempMax]).flat();
  const globalMin = Math.min(...allTemps);
  const globalMax = Math.max(...allTemps);
  const tempRange = globalMax - globalMin || 1;

  return (
    <div className="relative inline-block" ref={panelRef}>
      <motion.div
        className="mt-4 inline-flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 rounded-xl cursor-pointer select-none"
        style={{
          background: 'var(--color-glass)',
          border: '1px solid var(--color-glass-border)',
        }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        onClick={() => weather.forecast.length > 0 && setIsExpanded(!isExpanded)}
      >
        {/* 天气图标和温度 */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="text-xl sm:text-2xl">{getWeatherIcon(weather.icon)}</span>
          <span className="text-lg sm:text-xl font-medium" style={{ color: 'var(--color-text-primary)' }}>
            {weather.temperature}°C
          </span>
        </div>

        {/* 分隔线 */}
        <div className="w-px h-5 sm:h-6" style={{ background: 'var(--color-glass-border)' }} />

        {/* 天气详情 */}
        <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
          <span style={{ color: 'var(--color-text-secondary)' }}>{weather.description}</span>
          <span className="flex items-center gap-1" style={{ color: 'var(--color-text-muted)' }}>
            <Droplets className="w-3 h-3" />
            {weather.humidity}%
          </span>
          <span
            className="hidden sm:flex items-center gap-1"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <Wind className="w-3 h-3" />
            {weather.windSpeed}m/s
          </span>
        </div>

        {/* 城市 - 可点击编辑 */}
        <AnimatePresence mode="wait">
          {isEditing ? (
            <motion.div
              key="editing"
              className="flex items-center gap-1"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => e.stopPropagation()}
            >
              <input
                ref={inputRef}
                type="text"
                value={cityInput}
                onChange={(e) => setCityInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('weather.city_placeholder')}
                className="w-20 sm:w-24 px-2 py-0.5 text-xs rounded-md outline-none"
                style={{
                  background: 'var(--color-bg-secondary)',
                  color: 'var(--color-text-primary)',
                  border: '1px solid var(--color-glass-border)',
                }}
              />
              <button
                onClick={handleConfirm}
                className="p-0.5 rounded-md hover:bg-white/10 transition-colors"
                style={{ color: 'var(--color-accent)' }}
                title={t('common.confirm')}
              >
                <Check className="w-3 h-3" />
              </button>
              <button
                onClick={handleUseLocation}
                className="p-0.5 rounded-md hover:bg-white/10 transition-colors"
                style={{ color: 'var(--color-text-muted)' }}
                title={t('weather.use_location')}
              >
                <Navigation className="w-3 h-3" />
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="p-0.5 rounded-md hover:bg-white/10 transition-colors"
                style={{ color: 'var(--color-text-muted)' }}
                title={t('common.cancel')}
              >
                <X className="w-3 h-3" />
              </button>
            </motion.div>
          ) : (
            <motion.button
              key="display"
              onClick={(e) => { e.stopPropagation(); handleCityClick(); }}
              className="hidden md:flex items-center gap-1 text-xs hover:opacity-80 transition-opacity"
              style={{ color: 'var(--color-text-muted)' }}
              title={onCityChange ? t('weather.click_to_change_city') : undefined}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <MapPin className="w-3 h-3" />
              {weather.city}
            </motion.button>
          )}
        </AnimatePresence>

        {/* 展开箭头 */}
        {weather.forecast.length > 0 && (
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            style={{ color: 'var(--color-text-muted)' }}
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </motion.div>
        )}

        {/* 刷新按钮 */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRefresh();
          }}
          className="p-1 rounded-md hover:bg-white/10 transition-colors"
          style={{ color: 'var(--color-text-muted)' }}
          title={t('weather.refresh')}
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </motion.div>

      {/* 7 天预报面板 */}
      <AnimatePresence>
        {isExpanded && weather.forecast.length > 0 && (
          <motion.div
            className="fixed inset-x-0 mx-auto sm:absolute sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 mt-2 z-50 w-[calc(100vw-2rem)] max-w-[420px] rounded-2xl overflow-hidden backdrop-blur-xl"
            style={{
              background: 'var(--color-glass)',
              border: '1px solid var(--color-glass-border)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            }}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            {/* 头部 - 当前天气详情 */}
            <div className="px-4 sm:px-5 pt-4 pb-3">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5" style={{ color: 'var(--color-text-muted)' }} />
                  <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    {weather.city}
                  </span>
                </div>
                <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  {t('weather.seven_day_forecast')}
                </span>
              </div>

              {/* 当前天气大卡片 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="text-3xl sm:text-4xl">{getWeatherIcon(weather.icon)}</span>
                  <div>
                    <div className="text-2xl sm:text-3xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                      {weather.temperature}°
                    </div>
                    <div className="text-xs sm:text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      {weather.description}
                    </div>
                  </div>
                </div>
                <div className="text-right text-xs space-y-1" style={{ color: 'var(--color-text-muted)' }}>
                  <div className="flex items-center gap-1 justify-end">
                    <Thermometer className="w-3 h-3" />
                    <span className="hidden sm:inline">{t('weather.feels_like')}</span> {weather.feelsLike}°
                  </div>
                  <div className="flex items-center gap-1 justify-end">
                    <Droplets className="w-3 h-3" />
                    {weather.humidity}%
                  </div>
                  <div className="flex items-center gap-1 justify-end">
                    <Wind className="w-3 h-3" />
                    <span className="hidden sm:inline">{weather.windDirection}</span> {weather.windSpeed}m/s
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 justify-end">
                    <span className="flex items-center gap-0.5">
                      <Sunrise className="w-3 h-3" />
                      {weather.sunrise}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <Sunset className="w-3 h-3" />
                      {weather.sunset}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 分隔线 */}
            <div className="mx-4 sm:mx-5 h-px" style={{ background: 'var(--color-glass-border)' }} />

            {/* 7 天预报列表 */}
            <div className="px-4 sm:px-5 py-3 space-y-0.5">
              {weather.forecast.map((day, i) => (
                <ForecastRow
                  key={day.date}
                  day={day}
                  isToday={i === 0}
                  globalMin={globalMin}
                  tempRange={tempRange}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// 单行预报组件
function ForecastRow({ day, isToday, globalMin, tempRange }: {
  day: DailyForecast;
  isToday: boolean;
  globalMin: number;
  tempRange: number;
}) {
  const leftPct = ((day.tempMin - globalMin) / tempRange) * 100;
  const widthPct = ((day.tempMax - day.tempMin) / tempRange) * 100;

  return (
    <div
      className="flex items-center gap-1.5 sm:gap-2 py-1.5 rounded-lg px-1.5 sm:px-2 -mx-1.5 sm:-mx-2 transition-colors hover:bg-white/5"
    >
      {/* 日期 */}
      <span
        className="w-7 sm:w-8 text-[11px] sm:text-xs shrink-0"
        style={{
          color: isToday ? 'var(--color-accent)' : 'var(--color-text-secondary)',
          fontWeight: isToday ? 600 : 400,
        }}
      >
        {day.weekday}
      </span>

      {/* 天气图标 */}
      <span className="text-sm sm:text-base shrink-0 w-5 sm:w-6 text-center">{getWeatherIcon(day.icon)}</span>

      {/* 降水概率 */}
      <span
        className="w-9 sm:w-10 text-[10px] sm:text-xs text-right shrink-0 flex items-center justify-end gap-0.5"
        style={{
          color: day.precipProbability > 30 ? 'rgba(96, 165, 250, 0.9)' : 'var(--color-text-muted)',
          opacity: day.precipProbability > 0 ? 1 : 0.3,
        }}
      >
        <Umbrella className="w-2.5 h-2.5 shrink-0" />
        {day.precipProbability}%
      </span>

      {/* 最低温 */}
      <span className="w-6 sm:w-7 text-[11px] sm:text-xs text-right shrink-0" style={{ color: 'var(--color-text-muted)' }}>
        {day.tempMin}°
      </span>

      {/* 温度条 */}
      <div className="flex-1 min-w-[40px] h-1.5 rounded-full relative mx-0.5 sm:mx-1" style={{ background: 'var(--color-bg-tertiary)' }}>
        <div
          className="absolute h-full rounded-full"
          style={{
            left: `${leftPct}%`,
            width: `${Math.max(widthPct, 4)}%`,
            background: getTempGradient(day.tempMin, day.tempMax),
          }}
        />
      </div>

      {/* 最高温 */}
      <span
        className="w-6 sm:w-7 text-[11px] sm:text-xs shrink-0"
        style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}
      >
        {day.tempMax}°
      </span>
    </div>
  );
}

// 根据温度范围返回渐变色
function getTempGradient(min: number, max: number): string {
  const getColor = (temp: number) => {
    if (temp <= -10) return '147, 197, 253' // 深蓝
    if (temp <= 0) return '147, 197, 253'   // 蓝
    if (temp <= 10) return '134, 239, 172'  // 绿
    if (temp <= 20) return '253, 224, 71'   // 黄
    if (temp <= 30) return '251, 146, 60'   // 橙
    return '239, 68, 68'                     // 红
  }
  return `linear-gradient(to right, rgba(${getColor(min)}, 0.8), rgba(${getColor(max)}, 0.9))`
}

export default WeatherDisplay;
