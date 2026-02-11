import React, { useState, useCallback } from 'react';
import { useAudioStore } from '@/store/useAudioStore';
import { RustBeltChurchExterior } from './components/RustBeltChurchExterior';
import { RustBeltChurchInterior } from './components/RustBeltChurchInterior';

interface Props {
  onClose: () => void;
}

export const RustBeltFaith: React.FC<Props> = ({ onClose }) => {
  const [hasEntered, setHasEntered] = useState(false);
  const { playSfx } = useAudioStore();

  const handleEnter = useCallback(() => {
    // 使用现有音效作为替代
    playSfx('sfx_fabric_heavy');
    setHasEntered(true);
  }, [playSfx]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="w-full max-w-4xl aspect-video bg-[#111] shadow-2xl overflow-hidden border-4 border-[#333] relative"
        onClick={e => e.stopPropagation()}
      >
        {hasEntered ? (
          <RustBeltChurchInterior onClose={onClose} />
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
