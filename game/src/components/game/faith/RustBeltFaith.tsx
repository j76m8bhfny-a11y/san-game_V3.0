import React, { useState, useCallback } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { useAudioStore } from '@/store/useAudioStore';
import { RustBeltChurchExterior } from './components/RustBeltChurchExterior';
import { RustBeltChurchInterior } from './components/RustBeltChurchInterior';

interface Props {
  onClose: () => void;
}

export const RustBeltFaith: React.FC<Props> = ({ onClose }) => {
  const [hasEntered, setHasEntered] = useState(false);
  const { 
    vitality, 
    addNotification,
    addTransaction 
  } = useGameStore();
  
  const { playSfx } = useAudioStore();

  const handleEnter = useCallback(() => {
    playSfx('sfx_church_door_creak'); // 沉重的木门声
    // 稍微延迟播放背景环境音
    setTimeout(() => playSfx('sfx_gospel_choir_muffled'), 500);
    setHasEntered(true);
  }, [playSfx]);

  const handleTithe = useCallback((amount: number) => {
    const result = addTransaction('MISC', -amount, 'Church Tithe');
    if (result.success) {
      playSfx('sfx_coin_drop_bag'); // 钱币落入布袋声
      playSfx('sfx_crowd_amen'); // 人群喊阿门
      addNotification(`You donated $${amount}. The congregation welcomes you.`, 'SAN');
      // TODO: 增加 SAN 或 社区声望
    }
  }, [addTransaction, addNotification, playSfx]);

  const handleListen = useCallback(() => {
    playSfx('sfx_preacher_shout'); // 牧师嘶吼
    playSfx('sfx_organ_blast'); // 管风琴轰鸣
    addNotification('The sermon sets your soul on fire! Stress relieved.', 'SAN');
    // TODO: 消耗时间或增加临时 buff
  }, [addNotification, playSfx]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="w-full max-w-4xl aspect-video bg-[#111] shadow-2xl overflow-hidden border-4 border-[#333] relative"
        onClick={e => e.stopPropagation()}
      >
        {hasEntered ? (
          <RustBeltChurchInterior 
            gold={vitality.metrics.gold}
            onTithe={handleTithe}
            onListen={handleListen}
            onClose={onClose}
          />
        ) : (
          <RustBeltChurchExterior 
            onEnter={handleEnter}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  );
};