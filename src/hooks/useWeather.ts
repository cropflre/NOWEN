import { useState, useEffect, useCallback } from 'react'

// 天气数据接口
export interface WeatherData {
  temperature: number        // 温度 (°C)
  feelsLike: number         // 体感温度
  humidity: number          // 湿度 (%)
  description: string       // 天气描述
  icon: string              // 天气图标代码
  city: string              // 城市名
  windSpeed: number         // 风速 (m/s)
  windDirection: string     // 风向
  visibility: number        // 能见度 (km)
  pressure: number          // 气压 (hPa)
  sunrise: string           // 日出时间
  sunset: string            // 日落时间
  isDay: boolean            // 是否白天
}

// 天气图标映射
export const weatherIcons: Record<string, string> = {
  '01d': '☀️',  // 晴天
  '01n': '🌙',  // 晴夜
  '02d': '⛅',  // 少云
  '02n': '☁️',  // 少云夜
  '03d': '☁️',  // 多云
  '03n': '☁️',  // 多云夜
  '04d': '☁️',  // 阴天
  '04n': '☁️',  // 阴天夜
  '09d': '🌧️',  // 阵雨
  '09n': '🌧️',  // 阵雨夜
  '10d': '🌦️',  // 雨
  '10n': '🌧️',  // 雨夜
  '11d': '⛈️',  // 雷暴
  '11n': '⛈️',  // 雷暴夜
  '13d': '❄️',  // 雪
  '13n': '❄️',  // 雪夜
  '50d': '🌫️',  // 雾
  '50n': '🌫️',  // 雾夜
}

// 获取天气图标
export function getWeatherIcon(iconCode: string): string {
  return weatherIcons[iconCode] || '🌤️'
}

// 获取天气描述的中文映射
const weatherDescriptions: Record<string, string> = {
  'clear sky': '晴',
  'few clouds': '少云',
  'scattered clouds': '多云',
  'broken clouds': '多云',
  'overcast clouds': '阴',
  'shower rain': '阵雨',
  'rain': '雨',
  'light rain': '小雨',
  'moderate rain': '中雨',
  'heavy intensity rain': '大雨',
  'thunderstorm': '雷暴',
  'snow': '雪',
  'light snow': '小雪',
  'mist': '薄雾',
  'fog': '雾',
  'haze': '霾',
}

function translateDescription(desc: string): string {
  const lower = desc.toLowerCase()
  return weatherDescriptions[lower] || desc
}

// 风向转换
function getWindDirection(deg: number): string {
  const directions = ['北', '东北', '东', '东南', '南', '西南', '西', '西北']
  const index = Math.round(deg / 45) % 8
  return directions[index] + '风'
}

// 格式化时间
function formatTime(timestamp: number): string {
  const date = new Date(timestamp * 1000)
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

export function useWeather(enabled: boolean = true) {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const fetchWeather = useCallback(async (lat: number, lon: number) => {
    setLoading(true)
    setError(null)
    
    try {
      // 使用 Open-Meteo 免费 API (无需 API Key)
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure&daily=sunrise,sunset&timezone=auto`
      )
      
      if (!response.ok) {
        throw new Error('天气数据获取失败')
      }
      
      const data = await response.json()
      const current = data.current
      const daily = data.daily
      
      // 获取城市名称 (使用反向地理编码)
      let cityName = '当前位置'
      try {
        const geoResponse = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=zh`
        )
        if (geoResponse.ok) {
          const geoData = await geoResponse.json()
          cityName = geoData.address?.city || geoData.address?.town || geoData.address?.county || '当前位置'
        }
      } catch {
        // 地理编码失败，使用默认值
      }
      
      // WMO 天气代码转换
      const weatherCode = current.weather_code
      const isDay = new Date().getHours() >= 6 && new Date().getHours() < 18
      const iconCode = getWMOIcon(weatherCode, isDay)
      const description = getWMODescription(weatherCode)
      
      const weatherData: WeatherData = {
        temperature: Math.round(current.temperature_2m),
        feelsLike: Math.round(current.apparent_temperature),
        humidity: current.relative_humidity_2m,
        description,
        icon: iconCode,
        city: cityName,
        windSpeed: Math.round(current.wind_speed_10m * 10) / 10,
        windDirection: getWindDirection(current.wind_direction_10m),
        visibility: 10, // Open-Meteo 不提供能见度
        pressure: Math.round(current.surface_pressure),
        sunrise: formatTime(new Date(daily.sunrise[0]).getTime() / 1000),
        sunset: formatTime(new Date(daily.sunset[0]).getTime() / 1000),
        isDay,
      }
      
      setWeather(weatherData)
      setLastUpdate(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取天气失败')
    } finally {
      setLoading(false)
    }
  }, [])

  const refresh = useCallback(() => {
    if (!enabled) return
    
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchWeather(position.coords.latitude, position.coords.longitude)
        },
        (err) => {
          // 定位失败，使用默认位置 (北京)
          console.warn('定位失败，使用默认位置:', err.message)
          fetchWeather(39.9042, 116.4074)
        },
        { timeout: 10000, enableHighAccuracy: false }
      )
    } else {
      // 不支持定位，使用默认位置
      fetchWeather(39.9042, 116.4074)
    }
  }, [enabled, fetchWeather])

  useEffect(() => {
    if (!enabled) {
      setWeather(null)
      return
    }
    
    // 初始获取
    refresh()
    
    // 每 30 分钟更新一次
    const interval = setInterval(refresh, 30 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [enabled, refresh])

  return {
    weather,
    loading,
    error,
    lastUpdate,
    refresh,
  }
}

// WMO 天气代码转图标
function getWMOIcon(code: number, isDay: boolean): string {
  const suffix = isDay ? 'd' : 'n'
  
  if (code === 0) return `01${suffix}` // 晴
  if (code === 1) return `02${suffix}` // 少云
  if (code === 2) return `03${suffix}` // 多云
  if (code === 3) return `04${suffix}` // 阴
  if (code >= 45 && code <= 48) return `50${suffix}` // 雾
  if (code >= 51 && code <= 55) return `09${suffix}` // 毛毛雨
  if (code >= 56 && code <= 57) return `09${suffix}` // 冻毛毛雨
  if (code >= 61 && code <= 65) return `10${suffix}` // 雨
  if (code >= 66 && code <= 67) return `10${suffix}` // 冻雨
  if (code >= 71 && code <= 77) return `13${suffix}` // 雪
  if (code >= 80 && code <= 82) return `09${suffix}` // 阵雨
  if (code >= 85 && code <= 86) return `13${suffix}` // 阵雪
  if (code >= 95 && code <= 99) return `11${suffix}` // 雷暴
  
  return `02${suffix}`
}

// WMO 天气代码转描述
function getWMODescription(code: number): string {
  const descriptions: Record<number, string> = {
    0: '晴',
    1: '少云', 2: '多云', 3: '阴',
    45: '雾', 48: '雾凇',
    51: '小毛毛雨', 53: '毛毛雨', 55: '大毛毛雨',
    56: '冻毛毛雨', 57: '大冻毛毛雨',
    61: '小雨', 63: '中雨', 65: '大雨',
    66: '小冻雨', 67: '大冻雨',
    71: '小雪', 73: '中雪', 75: '大雪',
    77: '雪粒',
    80: '小阵雨', 81: '阵雨', 82: '大阵雨',
    85: '小阵雪', 86: '大阵雪',
    95: '雷暴', 96: '雷暴伴冰雹', 99: '强雷暴伴冰雹',
  }
  
  return descriptions[code] || '未知'
}
