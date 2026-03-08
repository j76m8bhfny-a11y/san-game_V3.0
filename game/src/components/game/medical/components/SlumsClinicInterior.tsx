import React from 'react';
import { MedicalService } from '@/types/schema';
import { SlumsMedicalItem } from './SlumsMedicalItem';
import { useI18n } from '@/i18n';

interface Props {
  services: MedicalService[];
  gold: number;
  onBuy: (serviceId: string) => void;
  onClose: () => void;
}

export const SlumsClinicInterior: React.FC<Props> = ({ services, gold, onBuy, onClose }) => {
  const { t } = useI18n();

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-4 select-none">
      
      {/* 1. 背景：肮脏的手术台 */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{ 
          backgroundImage: "url('/assets/medical/slums_clinic_table.jpg')",
        }}
      >
        {/* 顶灯光照效果 (Vignette) */}
        <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_30%,rgba(0,0,0,0.9)_90%)]" />
      </div>

      {/* 2. 容器：不锈钢托盘 */}
      <div className="relative z-10 w-[80%] max-w-3xl aspect-[4/3] bg-[#d1d5db] rounded-sm shadow-[0_20px_50px_rgba(0,0,0,0.8)] border-4 border-[#9ca3af] flex flex-col overflow-hidden">
        {/* 金属质感叠加 */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/brushed-alum.png')] opacity-50 pointer-events-none" />
        
        {/* 托盘边缘的反光 */}
        <div className="absolute top-0 left-0 right-0 h-4 bg-white/30" />
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-black/10" />

        {/* 物品散落区 */}
        <div className="flex-1 p-12 flex flex-wrap content-center justify-center gap-12 relative">
          
          {/* 血迹装饰 (位于物品下方) */}
          <img src="/assets/fx/blood_stain_1.png" className="absolute top-[20%] left-[10%] w-32 opacity-60 pointer-events-none mix-blend-multiply render-pixelated" />
          <img src="/assets/fx/blood_stain_2.png" className="absolute bottom-[30%] right-[20%] w-40 opacity-40 pointer-events-none mix-blend-multiply render-pixelated" />

          {services.map((service) => (
            <SlumsMedicalItem 
              key={service.id}
              service={service}
              canAfford={gold >= service.baseCost}
              onBuy={() => onBuy(service.id)}
            />
          ))}
        </div>

        {/* 底部信息栏 */}
        <div className="h-16 bg-[#1f2937] flex items-center justify-between px-6 border-t-4 border-[#374151] relative z-20">
          <div className="text-gray-400 font-mono text-xs">
            CREDIT: <span className={gold < 20 ? 'text-red-500' : 'text-green-500'}>${gold}</span>
          </div>
          
          <button 
            onClick={onClose}
            className="text-red-400 hover:text-white font-black font-marker text-lg tracking-widest hover:scale-110 transition-transform"
          >
            {t('common.close')}
          </button>
        </div>
      </div>

    </div>
  );
};
