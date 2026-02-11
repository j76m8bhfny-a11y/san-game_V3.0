import React, { useState, useMemo, useCallback } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { useAudioStore } from '@/store/useAudioStore';
import { SlumsShrineExterior } from './components/SlumsShrineExterior';
import { SlumsShrineInterior } from './components/SlumsShrineInterior';
import faithRules from '@/assets/data/rules/faithRules.json';

interface Props {
  onClose: () => void;
}

export const SlumsFaith: React.FC<Props> = ({ onClose }) => {
  const [hasEntered, setHasEntered] = useState(false);
  const [hasPrayedThisTurn, setHasPrayedThisTurn] = useState(false);
  const { 
    inventory,
    updatePlayerStats,
    addNotification,
    modifyStats,
    gameDataCache,
    vitality,
  } = useGameStore();
  
  const { playSfx } = useAudioStore();

  // 从 inventory (string[]) 和 gameDataCache 构建物品列表
  const playerItems = useMemo(() => {
    if (!gameDataCache?.items) return [];
    return inventory
      .map(id => gameDataCache.items.find(item => item.id === id))
      .filter((item): item is NonNullable<typeof item> => item !== undefined);
  }, [inventory, gameDataCache]);

  const handleEnter = useCallback(() => {
    playSfx('sfx_match_strike'); // 划火柴声
    setHasEntered(true);
  }, [playSfx]);

  const handleSacrifice = useCallback((itemId: string) => {
    const item = gameDataCache?.items?.find(i => i.id === itemId);
    if (!item) return;

    // 获取献祭配置
    const sacrificeConfig = (faithRules as any).regionalFaiths?.slums?.sacrifice;
    if (!sacrificeConfig?.enabled) {
      addNotification('献祭仪式暂时无法进行。', 'error');
      return;
    }

    // 根据物品标签确定效果
    let effect = sacrificeConfig.effectsByTag.DEFAULT;
    for (const tag of item.tags) {
      if (sacrificeConfig.effectsByTag[tag]) {
        effect = sacrificeConfig.effectsByTag[tag];
        break;
      }
    }

    playSfx('sfx_rat_squeak'); // 老鼠叫
    
    // 从 inventory 中移除一个物品（只移除第一个匹配的）
    const index = inventory.indexOf(itemId);
    if (index > -1) {
      const newInventory = [...inventory];
      newInventory.splice(index, 1);
      updatePlayerStats({ inventory: newInventory });
    }

    // 应用效果
    const updates: Partial<typeof vitality.metrics> = {};
    if (effect.hpRestore) updates.hp = vitality.metrics.hp + effect.hpRestore;
    if (effect.sanChange) updates.san = vitality.metrics.san + effect.sanChange;
    if (effect.addictionGain) updates.addiction = vitality.metrics.addiction + effect.addictionGain;
    
    if (Object.keys(updates).length > 0) {
      modifyStats(updates);
    }

    addNotification(effect.message || '祭品被接受了。', 'SAN');
  }, [gameDataCache?.items, inventory, vitality.metrics, modifyStats, updatePlayerStats, addNotification, playSfx]);

  const handlePray = useCallback(() => {
    const sacrificeConfig = (faithRules as any).regionalFaiths?.slums?.sacrifice;
    const prayer = sacrificeConfig?.prayer;
    
    // 检查是否每回合只能祈祷一次
    if (prayer?.oncePerTurn && hasPrayedThisTurn) {
      addNotification('你已经祈祷过了，神灵需要休息。', 'warning');
      return;
    }
    
    playSfx('sfx_whisper'); // 低语声
    
    if (prayer?.sanRestore) {
      modifyStats({ san: vitality.metrics.san + prayer.sanRestore });
    }
    
    setHasPrayedThisTurn(true);
    addNotification(prayer?.message || '你低声祈祷，在这无人倾听的世界里。', 'SAN');
  }, [hasPrayedThisTurn, vitality.metrics.san, modifyStats, addNotification, playSfx]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="w-full max-w-4xl aspect-video bg-[#111] shadow-2xl overflow-hidden border-4 border-[#333] relative"
        onClick={e => e.stopPropagation()}
      >
        {hasEntered ? (
          <SlumsShrineInterior 
            inventory={playerItems}
            hasPrayed={hasPrayedThisTurn}
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
