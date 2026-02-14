import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import zhCN from './locales/zh-CN.json';
import enUS from './locales/en-US.json';

export type Locale = 'zh-CN' | 'en-US';

export const locales: Record<Locale, typeof zhCN> = {
  'zh-CN': zhCN,
  'en-US': enUS,
};

interface I18nState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

// 简单的路径解析函数
const getNestedValue = (obj: any, path: string): string | undefined => {
  const keys = path.split('.');
  let value = obj;
  for (const key of keys) {
    if (value === undefined || value === null) return undefined;
    value = value[key];
  }
  return typeof value === 'string' ? value : undefined;
};

// 替换参数
const interpolate = (str: string, params?: Record<string, string | number>): string => {
  if (!params) return str;
  return str.replace(/\{(\w+)\}/g, (match, key) => {
    const value = params[key];
    return value !== undefined ? String(value) : match;
  });
};

export const useI18n = create<I18nState>()(
  persist(
    (set, get) => ({
      locale: 'zh-CN',
      setLocale: (locale) => set({ locale }),
      t: (key: string, params?: Record<string, string | number>) => {
        const { locale } = get();
        const messages = locales[locale];
        const value = getNestedValue(messages, key);
        if (value === undefined) {
          console.warn(`[i18n] Missing translation: ${key}`);
          return key;
        }
        return interpolate(value, params);
      },
    }),
    {
      name: 'i18n-storage',
      partialize: (state) => ({ locale: state.locale }),
    }
  )
);

// 便捷导出
export const t = (key: string, params?: Record<string, string | number>) => 
  useI18n.getState().t(key, params);
