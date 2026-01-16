import { useMemo } from 'react';
import { useGameStore } from '../store/useGameStore';

export const useVisualFilter = () => {
  const san = useGameStore((state) => state.san);

  return useMemo(() => {
    // Phase 1: 蓝药丸 (71-100) - 美好假象
    if (san > 70) {
      return {
        className: 'theme-blue-pill',
        style: { filter: 'none' }, // 高清无码
        fontClass: 'font-sans'
      };
    }
    
    // Phase 2: 裂痕 (31-70) - 现实剥落
    if (san > 30) {
      return {
        className: 'theme-cracks',
        style: { 
          filter: 'sepia(0.4) contrast(1.1) brightness(0.9)', // 脏旧感
          transition: 'filter 2s ease'
        },
        fontClass: 'font-mono' // 打字机风格
      };
    }

    // Phase 3: 古神 (0-30) - 彻底异化
    return {
      className: 'theme-old-ruler',
      style: {
        filter: 'contrast(1.4) saturate(1.2) hue-rotate(90deg)', // 诡异色调
        textShadow: '2px 0px 0px rgba(255,0,0,0.5), -2px 0px 0px rgba(0,0,255,0.5)', // 色差故障
        transition: 'filter 0.5s step-end',
      },
      fontClass: 'font-creepster' 
    };
  }, [san]);
};