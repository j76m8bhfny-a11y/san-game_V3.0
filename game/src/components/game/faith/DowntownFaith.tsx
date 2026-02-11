import React, { useState, useMemo, useCallback } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { useAudioStore } from '@/store/useAudioStore';
import { DowntownLodgeExterior } from './components/DowntownLodgeExterior';
import { DowntownLodgeInterior } from './components/DowntownLodgeInterior';
import faithRules from '@/assets/data/rules/faithRules.json';

interface Props {
  onClose: () => void;
}

export const DowntownFaith: React.FC<Props> = ({ onClose }) => {
  const [hasEntered, setHasEntered] = useState(false);
  const [hasSignedPact, setHasSignedPact] = useState(false);
  const { 
    vitality,
    modifyStats,
    addNotification,
    updateFlags,
  } = useGameStore();
  
  const { playSfx } = useAudioStore();

  // 检查是否已签署契约（通过 hiddenTags）
  const isAlreadySigned = useMemo(() => {
    return vitality.flags.hiddenTags?.includes('ILLUMINATI') ?? false;
  }, [vitality.flags.hiddenTags]);

  const handleEnter = useCallback(() => {
    playSfx('sfx_heavy_door_slide'); // 石门移动声
    setTimeout(() => playSfx('sfx_low_chant'), 800); // 低沉吟唱
    setHasEntered(true);
  }, [playSfx]);

  const handleSignPact = useCallback(() => {
    const pactConfig = (faithRules as any).regionalFaiths?.downtown?.pact;
    if (!pactConfig?.enabled) return;

    // 检查是否已签署
    if (isAlreadySigned || hasSignedPact) {
      addNotification(pactConfig.message.alreadySigned, 'warning');
      return;
    }

    playSfx('sfx_scribble_fast'); // 写字声
    setTimeout(() => {
      playSfx('sfx_gong_deep'); // 铜锣声
      
      // 扣除 MaxSanity
      const newMaxSan = Math.max(10, vitality.metrics.maxSan - pactConfig.cost.maxSan);
      const newSan = Math.min(newMaxSan, vitality.metrics.san);
      
      // 更新状态
      modifyStats({ maxSan: newMaxSan, san: newSan });
      
      // 添加 hiddenTag
      const currentTags = vitality.flags.hiddenTags || [];
      updateFlags({ hiddenTags: [...currentTags, pactConfig.reward.hiddenTag] });
      
      // 增加信用分
      if (pactConfig.reward.creditScoreBonus) {
        modifyStats({ creditScore: vitality.metrics.creditScore + pactConfig.reward.creditScoreBonus });
      }
      
      setHasSignedPact(true);
      addNotification(pactConfig.message.success, 'SAN');
      addNotification(pactConfig.reward.description, 'success');
    }, 1000);
  }, [isAlreadySigned, hasSignedPact, vitality.metrics.maxSan, vitality.metrics.san, vitality.metrics.creditScore, vitality.flags.hiddenTags, modifyStats, updateFlags, addNotification, playSfx]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl" onClick={onClose}>
      <div 
        className="w-full max-w-4xl aspect-[4/5] md:aspect-video bg-[#050505] shadow-[0_0_100px_rgba(0,0,0,1)] overflow-hidden border border-[#333] relative"
        onClick={e => e.stopPropagation()}
      >
        {hasEntered ? (
          <DowntownLodgeInterior 
            sanity={vitality.metrics.san}
            maxSanity={vitality.metrics.maxSan}
            hasSigned={isAlreadySigned || hasSignedPact}
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
