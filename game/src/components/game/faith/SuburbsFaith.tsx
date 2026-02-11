import React, { useState, useCallback } from 'react';
import { useAudioStore } from '@/store/useAudioStore';
import { SuburbsChurchExterior } from './components/SuburbsChurchExterior';
import { SuburbsChurchInterior } from './components/SuburbsChurchInterior';

interface Props {
  onClose: () => void;
}

export const SuburbsFaith: React.FC<Props> = ({ onClose }) => {
  const [hasEntered, setHasEntered] = useState(false);
  const { playSfx } = useAudioStore();

  const handleEnter = useCallback(() => {
    // 使用现有音效作为替代
    playSfx('sfx_hover');
    setHasEntered(true);
  }, [playSfx]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md" onClick={onClose}>
      <div 
        className="w-full max-w-5xl aspect-video bg-white shadow-2xl overflow-hidden border-4 border-gray-100 relative rounded-xl"
        onClick={e => e.stopPropagation()}
      >
        {hasEntered ? (
          <SuburbsChurchInterior onClose={onClose} />
        ) : (
          <SuburbsChurchExterior 
            onEnter={handleEnter}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  );
};
