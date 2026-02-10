import React, { useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { useAudioStore } from '@/store/useAudioStore';
import { SlumsShrineExterior } from './components/SlumsShrineExterior';
import { SlumsShrineInterior } from './components/SlumsShrineInterior';

interface Props {
  onClose: () => void;
}

export const SlumsFaith: React.FC<Props> = ({ onClose }) => {
  const [hasEntered, setHasEntered] = useState(false);
  const { 
    vitality, 
    addNotification,
    // 假设 store 里有这些方法，或者直接操作 inventory
    removeItem, 
  } = useGameStore();
  
  const { playSfx } = useAudioStore();

  // 模拟获取玩家背包数据
  const mockInventory = [
    { id: 'item_1', name: 'Cheap Vodka', tags: ['ALCOHOL'], price: 5 },
    { id: 'item_2', name: 'Stale Bread', tags: ['FOOD'], price: 2 },
    { id: 'item_3', name: 'Cigarettes', tags: ['DRUG'], price: 8 },
  ] as any[]; // 临时 Mock

  const handleEnter = () => {
    playSfx('sfx_match_strike'); // 划火柴声
    setHasEntered(true);
  };

  const handleSacrifice = (itemId: string) => {
    playSfx('sfx_rat_squeak'); // 老鼠叫
    // removeItem(itemId);
    addNotification('The spirits accepted your offering. Luck +1.', 'SAN');
  };

  const handlePray = () => {
    playSfx('sfx_whisper'); // 低语声
    addNotification('You muttered a prayer. You feel slightly better.', 'SAN');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="w-full max-w-4xl aspect-video bg-[#111] shadow-2xl overflow-hidden border-4 border-[#333] relative"
        onClick={e => e.stopPropagation()}
      >
        {hasEntered ? (
          <SlumsShrineInterior 
            inventory={mockInventory} // 替换为真实 inventory
            onSacrifice={handleSacrifice}
            onPray={handlePray}
            onClose={onClose}
          />
        ) : (
          <SlumsShrineExterior 
            onEnter={handleEnter}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  );
};