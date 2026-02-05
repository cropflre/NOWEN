import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Droplets, Wind, RefreshCw } from 'lucide-react';
import { WeatherData, getWeatherIcon } from '../../hooks/useWeather';

interface WeatherDisplayProps {
  weather: WeatherData | null;
  loading: boolean;
  onRefresh: () => void;
}

export function WeatherDisplay({ weather, loading, onRefresh }: WeatherDisplayProps) {
  if (!weather) return null;

  return (
    <motion.div
      className="mt-4 inline-flex items-center gap-3 px-4 py-2 rounded-xl"
      style={{
        background: 'var(--color-glass)',
        border: '1px solid var(--color-glass-border)',
      }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      {/* 天气图标和温度 */}
      <div className="flex items-center gap-2">
        <span className="text-2xl">{getWeatherIcon(weather.icon)}</span>
        <span className="text-xl font-medium" style={{ color: 'var(--color-text-primary)' }}>
          {weather.temperature}°C
        </span>
      </div>

      {/* 分隔线 */}
      <div className="w-px h-6" style={{ background: 'var(--color-glass-border)' }} />

      {/* 天气详情 */}
      <div className="flex items-center gap-3 text-sm">
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

      {/* 城市 */}
      <div
        className="hidden md:flex items-center gap-1 text-xs"
        style={{ color: 'var(--color-text-muted)' }}
      >
        <MapPin className="w-3 h-3" />
        {weather.city}
      </div>

      {/* 刷新按钮 */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRefresh();
        }}
        className="p-1 rounded-md hover:bg-white/10 transition-colors"
        style={{ color: 'var(--color-text-muted)' }}
        title="刷新天气"
      >
        <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
      </button>
    </motion.div>
  );
}

export default WeatherDisplay;
