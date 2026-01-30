import { useState, useEffect, useMemo } from 'react'

export function useTime() {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const hours = time.getHours()
  const minutes = time.getMinutes()
  const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
  
  const greeting = useMemo(() => {
    if (hours < 6) return '夜深了，注意休息'
    if (hours < 9) return '早安，新的一天'
    if (hours < 12) return '上午好'
    if (hours < 14) return '午安'
    if (hours < 17) return '下午好'
    if (hours < 19) return '傍晚好'
    if (hours < 22) return '晚上好'
    return '夜深了'
  }, [hours])

  const formattedDate = time.toLocaleDateString('zh-CN', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  return {
    time,
    hours,
    minutes,
    formattedTime,
    formattedDate,
    greeting,
    isNight: hours < 6 || hours >= 19,
  }
}
