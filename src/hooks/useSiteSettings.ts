import { useState, useEffect } from 'react';
import { fetchSettings, fetchQuotes, SiteSettings, SearchEngineSettings } from '../lib/api';
import { setActiveQuotes } from '../data/quotes';

// 默认站点设置
export const defaultSiteSettings: SiteSettings = {
  siteTitle: "NOWEN",
  siteFavicon: "",
  enableBeamAnimation: true,
  enableLiteMode: false,
  enableWeather: true,
  enableLunar: true,
  categoryCollapseThreshold: 0,
  categoryInitialShowCount: 8,
  widgetVisibility: {
    systemMonitor: false,
    hardwareIdentity: false,
    vitalSigns: false,
    networkTelemetry: false,
    processMatrix: false,
    dockMiniMonitor: false,
    mobileTicker: false,
    aiAssistant: true,
    systemMonitorAccess: 'public',
    hardwareIdentityAccess: 'public',
    vitalSignsAccess: 'public',
    networkTelemetryAccess: 'public',
    processMatrixAccess: 'public',
    dockMiniMonitorAccess: 'public',
    mobileTickerAccess: 'public',
    aiAssistantAccess: 'public',
  },
  menuVisibility: {
    languageToggle: true,
    themeToggle: true,
  },
  wallpaper: {
    enabled: false,
    source: 'upload',
    imageData: '',
    imageUrl: '',
    blur: 0,
    overlay: 30,
  },
  cardViewMode: 'standard',
  widgetSizeMode: 'M',
  accessMode: 'public',
  defaultBookmarkVisibility: 'public',
};

// 默认小部件可见性（加载前隐藏避免闪烁）
const hiddenWidgetVisibility = {
  systemMonitor: false,
  hardwareIdentity: false,
  vitalSigns: false,
  networkTelemetry: false,
  processMatrix: false,
  dockMiniMonitor: false,
  mobileTicker: false,
  aiAssistant: true,
  systemMonitorAccess: 'public' as const,
  hardwareIdentityAccess: 'public' as const,
  vitalSignsAccess: 'public' as const,
  networkTelemetryAccess: 'public' as const,
  processMatrixAccess: 'public' as const,
  dockMiniMonitorAccess: 'public' as const,
  mobileTickerAccess: 'public' as const,
  aiAssistantAccess: 'public' as const,
};

export function useSiteSettings() {
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(defaultSiteSettings);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  // 快捷访问属性 - 确保类型为 boolean
  const isLiteMode = siteSettings.enableLiteMode ?? false;
  const showWeather = siteSettings.enableWeather ?? true;
  const showLunar = siteSettings.enableLunar ?? true;
  const weatherCity = siteSettings.weatherCity || '';
  const enableAutoAi = siteSettings.enableAutoAi ?? true;

  // 分类折叠配置
  const categoryCollapseThreshold = siteSettings.categoryCollapseThreshold ?? 0;
  const categoryInitialShowCount = siteSettings.categoryInitialShowCount ?? 8;

  // 书签卡片视图模式
  const cardViewMode = siteSettings.cardViewMode ?? 'standard';

  // 监控 Widget 尺寸模式
  const widgetSizeMode = siteSettings.widgetSizeMode ?? 'M';

  // 访问模式
  const accessMode = siteSettings.accessMode ?? 'public';

  // 新书签默认可见性
  const defaultBookmarkVisibility = siteSettings.defaultBookmarkVisibility ?? 'public';

  // 搜索引擎配置
  const searchEngine: SearchEngineSettings = siteSettings.searchEngine ?? { defaultEngineId: 'google', customEngines: [] };

  // 菜单可见性
  const menuVisibility = siteSettings.menuVisibility || {
    languageToggle: true,
    themeToggle: true,
  };

  // 小部件可见性 - 设置未加载完成时默认隐藏所有小部件避免闪烁
  const widgetVisibility = settingsLoaded
    ? siteSettings.widgetVisibility || defaultSiteSettings.widgetVisibility!
    : hiddenWidgetVisibility;

  // 加载设置
  useEffect(() => {
    // 加载站点设置
    fetchSettings()
      .then((settings) => {
        setSiteSettings(settings);
        setSettingsLoaded(true);
        // 应用站点标题
        if (settings.siteTitle) {
          document.title = settings.siteTitle;
        }
        // 应用站点图标
        if (settings.siteFavicon) {
          const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
          if (link) {
            link.href = settings.siteFavicon;
          } else {
            const newLink = document.createElement("link");
            newLink.rel = "icon";
            newLink.href = settings.siteFavicon;
            document.head.appendChild(newLink);
          }
        }
      })
      .catch((err) => {
        console.error(err);
        setSettingsLoaded(true); // 即使出错也标记为已加载，使用默认设置
      });

    // 加载名言
    fetchQuotes()
      .then((data) => {
        setActiveQuotes(data.quotes, data.useDefaultQuotes, data.showQuotes);
      })
      .catch(console.error);
  }, []);

  return {
    siteSettings,
    setSiteSettings,
    settingsLoaded,
    isLiteMode,
    showWeather,
    showLunar,
    weatherCity,
    enableAutoAi,
    menuVisibility,
    widgetVisibility,
    categoryCollapseThreshold,
    categoryInitialShowCount,
    cardViewMode,
    widgetSizeMode,
    accessMode,
    defaultBookmarkVisibility,
    searchEngine,
  };
}
