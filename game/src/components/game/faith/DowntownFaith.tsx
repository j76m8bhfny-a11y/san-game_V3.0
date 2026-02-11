import React, { useState, useCallback } from 'react';
import { useAudioStore } from '@/store/useAudioStore';
import { DowntownLodgeExterior } from './components/DowntownLodgeExterior';
import { DowntownLodgeInterior } from './components/DowntownLodgeInterior';

interface Props {
  onClose: () => void;
}

export const DowntownFaith: React.FC<Props> = ({ onClose }) => {
  const [hasEntered, setHasEntered] = useState(false);
  const { playSfx } = useAudioStore();

  const handleEnter = useCallback(() => {
    // 使用现有音效作为替代
    playSfx('sfx_paper');
    setHasEntered(true);
  }, [playSfx]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl" onClick={onClose}>
      <div 
        className="w-full max-w-4xl aspect-[4/5] md:aspect-video bg-[#050505] shadow-[0_0_100px_rgba(0,0,0,1)] overflow-hidden border border-[#333] relative"
        onClick={e => e.stopPropagation()}
      >
        {hasEntered ? (
          <DowntownLodgeInterior onClose={onClose} />
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
