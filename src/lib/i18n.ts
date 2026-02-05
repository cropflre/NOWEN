import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// 引入语言包
import en from '../locales/en.json';
import zh from '../locales/zh.json';

i18n
  // 1. 嗅探用户浏览器的语言偏好
  .use(LanguageDetector)
  // 2. 注入 React 绑定
  .use(initReactI18next)
  // 3. 初始化配置
  .init({
    resources: {
      en: { translation: en },
      zh: { translation: zh },
    },
    fallbackLng: 'zh', // 默认回退到中文
    interpolation: {
      escapeValue: false, // React 已经处理了 XSS，这里不需要转义
    },
    detection: {
      // 优先从 localStorage 读取，其次是浏览器设置
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'], // 记住用户的选择
    },
  });

export default i18n;
