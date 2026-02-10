import React, { useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { useAudioStore } from '@/store/useAudioStore';
import { DowntownLodgeExterior } from './components/DowntownLodgeExterior';
import { DowntownLodgeInterior } from './components/DowntownLodgeInterior';

interface Props {
  onClose: () => void;
}

export const DowntownFaith: React.FC<Props> = ({ onClose }) => {
  const [hasEntered, setHasEntered] = useState(false);
  const { 
    vitality, 
    addNotification,
    // modifyMaxSanity // 假设 store 有此方法
  } = useGameStore();
  
  const { playSfx } = useAudioStore();

  const handleEnter = () => {
    playSfx('sfx_heavy_door_slide'); // 石门移动声
    setTimeout(() => playSfx('sfx_low_chant'), 800); // 低沉吟唱
    setHasEntered(true);
  };

  const handleSignPact = () => {
    playSfx('sfx_scribble_fast'); // 写字声
    setTimeout(() => {
      playSfx('sfx_gong_deep'); // 铜锣声
      addNotification('The Pact is sealed. You are one of Us now.', 'SAN');
      // 实际逻辑：扣除 Sanity 上限，增加 Hidden Tag 'ILLUMINATI'
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl" onClick={onClose}>
      <div 
        className="w-full max-w-4xl aspect-[4/5] md:aspect-video bg-[#050505] shadow-[0_0_100px_rgba(0,0,0,1)] overflow-hidden border border-[#333] relative"
        onClick={e => e.stopPropagation()}
      >
        {hasEntered ? (
          <DowntownLodgeInterior 
            sanity={vitality.metrics.san}
            onSignPact={handleSignPact}
            onClose={onClose}
          />
        ) : (
          <DowntownLodgeExterior 
            onEnter={handleEnter}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  );
};