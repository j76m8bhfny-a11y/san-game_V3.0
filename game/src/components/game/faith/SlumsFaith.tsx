import React, { useState, useCallback } from 'react';
import { useAudioStore } from '@/store/useAudioStore';
import { SlumsShrineExterior } from './components/SlumsShrineExterior';
import { SlumsShrineInterior } from './components/SlumsShrineInterior';

interface Props {
  onClose: () => void;
}

export const SlumsFaith: React.FC<Props> = ({ onClose }) => {
  const [hasEntered, setHasEntered] = useState(false);
  const { playSfx } = useAudioStore();

  const handleEnter = useCallback(() => {
    playSfx('sfx_click'); // 点击声
    setHasEntered(true);
  }, [playSfx]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="w-full max-w-4xl aspect-video bg-[#111] shadow-2xl overflow-hidden border-4 border-[#333] relative"
        onClick={e => e.stopPropagation()}
      >
        {hasEntered ? (
          <SlumsShrineInterior onClose={onClose} />
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
