import React, { useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { useAudioStore } from '@/store/useAudioStore';
import { SlumsClinicExterior } from './components/SlumsClinicExterior';
import { SlumsClinicInterior } from './components/SlumsClinicInterior';
import { RegionID } from '@/types/schema';

interface Props {
  onClose: () => void;
}

export const SlumsMedical: React.FC<Props> = ({ onClose }) => {
  const [hasEntered, setHasEntered] = useState(false);
  const { 
    gameDataCache, 
    vitality, 
    addNotification, 
    // performMedicalTreatment // 假设 store 中有处理医疗逻辑的方法
  } = useGameStore();
  
  const { playSfx } = useAudioStore();

  // 1. 获取当前区域的医疗服务
  const services = gameDataCache?.regions?.find(r => r.id === RegionID.Slums)?.hospitalTheme?.services 
    || []; 
  // 注意：实际项目中你可能需要直接从 gameDataCache.services 过滤，或者用 getRegionServices 辅助函数
  // 这里为了演示，假设你有办法获取到 services 列表

  const handleEnter = () => {
    playSfx('sfx_metal_door_creak'); // 门轴声
    setHasEntered(true);
  };

  const handleBuy = (serviceId: string) => {
    // 调用 store 的购买逻辑
    // const result = performMedicalTreatment(serviceId);
    
    // 模拟成功
    playSfx('sfx_pills_shake'); // 药瓶声
    // 或者 playSfx('sfx_surgery_saw'); // 手术声
    addNotification('You swallowed the pills. Hope they work.', 'HP');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="w-full max-w-4xl aspect-video bg-[#111] shadow-2xl overflow-hidden border-4 border-[#333] relative"
        onClick={e => e.stopPropagation()}
      >
        {hasEntered ? (
          <SlumsClinicInterior 
            services={services} // 这里需要传入真实数据
            gold={vitality.metrics.gold}
            onBuy={handleBuy}
            onClose={onClose}
          />
        ) : (
          <SlumsClinicExterior 
            onEnter={handleEnter}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  );
};