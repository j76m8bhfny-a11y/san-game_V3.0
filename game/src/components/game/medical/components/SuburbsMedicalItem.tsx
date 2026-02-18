import React, { useState } from 'react';
import { MedicalService } from '@/types/schema';
import { useI18n } from '@/i18n';

interface Props {
  service: MedicalService;
  canAfford: boolean;
  onBuy: () => void;
}

export const SuburbsMedicalItem: React.FC<Props> = ({ service, canAfford, onBuy }) => {
  const [isHovered, setIsHovered] = useState(false);
  const { t } = useI18n();

  // 图标映射
  const getIcon = (type: string) => {
    switch (type) {
      case 'DRUG': return '💊'; // 胶囊
      case 'THERAPY': return '🧠'; // 脑补/心理
      case 'SURGERY': return '🩹'; // 高级创可贴/微创
      default: return '🧴'; // 瓶子
    }
  };

  return (
    <div 
      className={`
        relative group cursor-pointer w-full h-32 bg-white rounded-xl shadow-md border border-gray-100
        transition-all duration-300 overflow-hidden flex flex-col items-center justify-center
        ${canAfford ? 'hover:shadow-xl hover:border-red-200 hover:-translate-y-1' : 'opacity-60 grayscale cursor-not-allowed'}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={canAfford ? onBuy : undefined}
    >
      {/* 包装盒顶部颜色条 */}
      <div className="absolute top-0 w-full h-2 bg-gradient-to-r from-red-500 to-red-600" />

      {/* 物品图标 */}
      <div className={`
        text-4xl mb-2 transition-transform duration-300
        ${isHovered ? 'scale-110' : 'scale-100'}
      `}>
        {getIcon(service.type)}
      </div>

      {/* 名称 */}
      <div className="font-bold text-gray-800 text-sm text-center px-2 leading-tight">
        {service.name}
      </div>

      {/* 价格标签 (超市风格) */}
      <div className={`
        absolute top-3 right-3 bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-0.5 rounded
        transition-transform duration-200
        ${isHovered ? 'scale-110 rotate-3' : ''}
      `}>
        ${service.baseCost}
      </div>

      {/* 悬浮详情 (像是一个弹出的说明书) */}
      <div className={`
        absolute inset-0 bg-white/95 p-3 flex flex-col justify-center items-center text-center
        transition-all duration-200 z-10
        ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}
      `}>
        <p className="text-[10px] text-gray-500 italic mb-2 line-clamp-2">
          "{service.flavorText}"
        </p>
        
        <div className="space-y-1 w-full">
          {service.effects?.hpRestore && (
            <div className="flex justify-between text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded">
              <span>Health</span>
              <span>+{service.effects.hpRestore}</span>
            </div>
          )}
          {service.effects?.sanRestore && (
            <div className="flex justify-between text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
              <span>Insight</span>
              <span>+{service.effects.sanRestore}</span>
            </div>
          )}
        </div>

        {!canAfford && (
           <div className="absolute bottom-1 w-full text-center text-[9px] text-red-500 font-bold uppercase">
             {t('common.confirm')}
           </div>
        )}
      </div>
    </div>
  );
};
