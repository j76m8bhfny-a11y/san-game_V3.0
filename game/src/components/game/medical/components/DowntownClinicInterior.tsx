import React from 'react';
import { MedicalService } from '@/types/schema';
import { DowntownMedicalItem } from './DowntownMedicalItem';
import { useI18n } from '@/i18n';

interface Props {
  services: MedicalService[];
  gold: number;
  onBuy: (serviceId: string) => void;
  onClose: () => void;
}

export const DowntownClinicInterior: React.FC<Props> = ({ services, gold, onBuy, onClose }) => {
  const { t } = useI18n();
  
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-4 select-none bg-black">
      
      {/* 1. 背景：高科技实验室 */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{ 
          backgroundImage: "url('/assets/medical/downtown_clinic_interior.jpg')",
        }}
      >
        {/* 覆盖一层科技感的网格 */}
        <div className="absolute inset-0 bg-[url('/assets/fx/grid_overlay.png')] opacity-10" />
        <div className="absolute inset-0 bg-black/60" />
      </div>

      {/* 2. 容器：全息操作台 */}
      <div className="relative z-10 w-full max-w-6xl h-[85%] flex">
        
        {/* 左侧：身体状态监控 (装饰) */}
        <div className="w-1/3 h-full border-r border-cyan-900/30 backdrop-solid-dark p-8 flex flex-col justify-center">
           <div className="mb-8">
             <div className="text-[10px] text-cyan-600 font-mono mb-1">SUBJECT ANALYSIS</div>
             <div className="w-full h-64 border border-cyan-500/20 relative overflow-hidden flex items-center justify-center">
                {/* 模拟人体扫描图 */}
                <img src="/assets/medical/ui_body_scan.png" className="h-full object-contain opacity-80 animate-pulse-slow render-pixelated" />
                <div className="absolute top-0 w-full h-1 bg-cyan-400/50 animate-scan" />
             </div>
           </div>

           <div className="space-y-4 font-mono text-xs">
             <div className="flex justify-between text-gray-400">
               <span>HEART RATE</span>
               <span className="text-cyan-400">62 BPM</span>
             </div>
             <div className="flex justify-between text-gray-400">
               <span>CORTISOL</span>
               <span className="text-cyan-400">OPTIMAL</span>
             </div>
             <div className="flex justify-between text-gray-400">
               <span>ASSETS</span>
               <span className="text-white">${gold.toLocaleString()}</span>
             </div>
           </div>
        </div>

        {/* 右侧：服务选择矩阵 */}
        <div className="flex-1 p-10 bg-black/60 flex flex-col">
          <div className="mb-6 flex justify-between items-end">
            <h2 className="text-3xl font-thin text-white tracking-[0.2em]">{t('hospital.title')}</h2>
            <div className="text-cyan-600 text-[10px] font-mono">V 4.2.0 BETA</div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar grid grid-cols-2 lg:grid-cols-3 gap-6 content-start">
            {services.map((service) => (
              <DowntownMedicalItem 
                key={service.id}
                service={service}
                canAfford={gold >= service.baseCost}
                onBuy={() => onBuy(service.id)}
              />
            ))}
          </div>

          <div className="mt-8 flex justify-end">
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-cyan-400 text-xs font-mono uppercase tracking-widest transition-colors"
            >
              &lt; {t('common.close')} &gt;
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
