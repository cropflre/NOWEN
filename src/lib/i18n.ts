import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// 引入语言包
import en from '../locales/en.json';
import zh from '../locales/zh.json';
import ja from '../locales/ja.json';
import ko from '../locales/ko.json';

// 支持的语言列表（按切换顺序）
export const supportedLanguages = ['zh', 'en', 'ja', 'ko'] as const;
export type SupportedLanguage = typeof supportedLanguages[number];

// 语言显示名称
export const languageNames: Record<SupportedLanguage, string> = {
  zh: '中文',
  en: 'English',
  ja: '日本語',
  ko: '한국어',
};

// 获取下一个语言（循环切换）
export function getNextLanguage(current: string): SupportedLanguage {
  const idx = supportedLanguages.indexOf(current as SupportedLanguage);
  return supportedLanguages[(idx + 1) % supportedLanguages.length];
}

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
      ja: { translation: ja },
      ko: { translation: ko },
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
