import { useState, useEffect, useMemo } from "react";
// @ts-ignore - lunar-javascript 没有类型定义
import { Lunar, Solar } from "lunar-javascript";

export function useTime() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = time.getHours();
  const minutes = time.getMinutes();
  const seconds = time.getSeconds();
  const formattedTime = `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  const greeting = useMemo(() => {
    if (hours < 6) return "夜深了，注意休息";
    if (hours < 9) return "早安，新的一天";
    if (hours < 12) return "上午好";
    if (hours < 14) return "午安";
    if (hours < 17) return "下午好";
    if (hours < 19) return "傍晚好";
    if (hours < 22) return "晚上好";
    return "夜深了";
  }, [hours]);

  const formattedDate = time.toLocaleDateString("zh-CN", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  // 农历日期
  const lunarDate = useMemo(() => {
    try {
      const solar = Solar.fromDate(time);
      const lunar = solar.getLunar() as Lunar;
      const monthName = lunar.getMonthInChinese();
      const dayName = lunar.getDayInChinese();
      // 获取节气（如果当天是节气的话）
      const jieQi = lunar.getJieQi();
      // 获取节日
      const festivals = lunar.getFestivals() as string[];
      const festival = festivals.length > 0 ? festivals[0] : null;

      return {
        month: monthName,
        day: dayName,
        fullDate: `${monthName}月${dayName}`,
        jieQi: jieQi || null,
        festival: festival,
        // 显示优先级：节日 > 节气 > 普通日期
        display: festival || jieQi || `${monthName}月${dayName}`,
      };
    } catch (e) {
      return {
        month: "",
        day: "",
        fullDate: "",
        jieQi: null,
        festival: null,
        display: "",
      };
    }
  }, [time.getFullYear(), time.getMonth(), time.getDate()]);

  return {
    time,
    hours,
    minutes,
    formattedTime,
    formattedDate,
    lunarDate,
    greeting,
    isNight: hours < 6 || hours >= 19,
  };
}
