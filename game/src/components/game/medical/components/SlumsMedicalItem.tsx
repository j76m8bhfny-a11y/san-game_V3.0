import React, { useMemo, useState } from 'react';
import { MedicalService } from '@/types/schema';
import { useI18n } from '@/i18n';

interface Props {
  service: MedicalService;
  canAfford: boolean;
  onBuy: () => void;
}

export const SlumsMedicalItem: React.FC<Props> = ({ service, canAfford, onBuy }) => {
  const [isHovered, setIsHovered] = useState(false);
  const { t } = useI18n();

  // 随机位置参数 (模拟散落感)
  const style = useMemo(() => ({
    rotation: Math.random() * 40 - 20, // -20deg ~ 20deg
    offsetX: Math.random() * 10 - 5,
    offsetY: Math.random() * 10 - 5,
  }), []);

  // 图标映射
  const getIcon = (type: string) => {
    switch (type) {
      case 'DRUG': return '💊'; // 散装药丸
      case 'SURGERY': return '💉'; // 注射器/手术刀
      case 'EMERGENCY': return '🩸'; // 血袋
      default: return '🩹'; // 绷带
    }
  };

  return (
    <div 
      className="relative group cursor-pointer w-24 h-24 flex items-center justify-center"
      style={{
        transform: `translate(${style.offsetX}px, ${style.offsetY}px) rotate(${style.rotation}deg)`,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={canAfford ? onBuy : undefined}
    >
      {/* 物品本体 */}
      <div className={`
        text-6xl transition-all duration-200 filter
        ${isHovered ? 'scale-125 drop-shadow-2xl brightness-110' : 'drop-shadow-md brightness-90'}
        ${!canAfford ? 'grayscale opacity-50' : ''}
      `}>
        {getIcon(service.type)}
      </div>

      {/* 价格标签 (像是一块染血的胶布) */}
      <div className={`
        absolute -bottom-4 left-1/2 -translate-x-1/2 
        bg-[#e5e7eb] text-red-900 font-marker text-sm px-2 py-0.5
        shadow-md transform -rotate-3 border border-gray-300
        group-hover:scale-110 transition-transform z-10 whitespace-nowrap
      `}>
        ${service.baseCost}
      </div>

      {/* 详情浮窗 (脏兮兮的纸条) */}
      <div className={`
        absolute bottom-full mb-2 w-40 bg-[#f3f4f6] text-black p-3 
        shadow-[5px_5px_0px_rgba(0,0,0,0.5)] border-2 border-[#d1d5db]
        transform transition-all duration-200 pointer-events-none z-50
        ${isHovered ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-95 rotate-6'}
      `}>
        {/* 纸条上的血迹装饰 */}
        <div className="absolute top-0 right-0 w-6 h-6 bg-red-800/20 rounded-full blur-md" />
        
        <h3 className="font-black font-mono text-sm uppercase mb-1">{service.name}</h3>
        <p className="text-[10px] font-serif leading-tight text-gray-600 mb-2">
          "{service.flavorText}"
        </p>
        
        {/* 效果预览 (不确定的感觉) */}
        <div className="text-[10px] font-bold font-mono">
          {service.effects?.hpRestore && <span className="text-green-700 block">HP: +{service.effects.hpRestore}?</span>}
          {service.effects?.sanRestore && <span className="text-amber-700 block">灵视+{service.effects.sanRestore}?</span>}
        </div>

        {!canAfford && (
          <div className="mt-2 text-center text-red-600 font-black text-xs uppercase border-2 border-red-600 -rotate-2">
            {t('common.price')}
          </div>
        )}
      </div>
    </div>
  );
};
