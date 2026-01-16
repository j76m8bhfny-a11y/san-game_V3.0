import { useMemo } from 'react';
import { useGameStore } from '../store/useGameStore';

/**
 * 视觉滤镜 Hook
 * * [Fix #4 - 配置提示]
 * 请确保在 tailwind.config.js 中配置了以下 FontFamily:
 * theme: {
 * extend: {
 * fontFamily: {
 * 'creepster': ['"Creepster"', 'system-ui', 'cursive'], // 需要引入 Google Fonts 或本地字体
 * 'mono': ['"Courier New"', 'monospace'],
 * }
 * }
 * }
 */
export const useVisualFilter = () => {
  const san = useGameStore((state) => state.san);

  const filterStyle = useMemo(() => {
    // 阶段 1: 蓝药丸 (0-30)
    if (san <= 30) {
      return {
        className: 'theme-blue-pill',
        style: {
          filter: 'sepia(0.3) contrast(0.9) saturate(1.2)',
          transition: 'filter 1s ease',
        },
        fontClass: 'font-sans'
      };
    }
    
    // 阶段 2: 裂痕 (31-70)
    if (san <= 70) {
      return {
        className: 'theme-cracks',
        style: {
          filter: 'contrast(1.2) hue-rotate(-5deg)',
          transition: 'filter 1s ease',
        },
        fontClass: 'font-mono'
      };
    }

    // 阶段 3: 古神 (71-100)
    return {
      className: 'theme-old-ruler',
      style: {
        filter: 'invert(0.9) grayscale(0.6) contrast(1.5)',
        textShadow: '0 0 5px rgba(255, 0, 0, 0.7)',
        transition: 'filter 0.5s ease',
      },
      // 必须在 Tailwind 配置文件中注册此字体
      fontClass: 'font-creepster' 
    };
  }, [san]);

  return filterStyle;
};
