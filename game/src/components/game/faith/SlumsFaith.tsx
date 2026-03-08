import React from 'react';

import { SlumsShrineInterior } from './components/SlumsShrineInterior';

interface Props {
  onClose: () => void;
}

export const SlumsFaith: React.FC<Props> = ({ onClose }) => {

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-solid-dark" 
      onClick={onClose}
    >
      <div 
        className="w-full max-w-4xl aspect-video bg-[#111] shadow-pixel overflow-hidden border-4 border-[#333] relative"
        onClick={e => e.stopPropagation()}
      >
        <SlumsShrineInterior onClose={onClose} />
      </div>
    </div>
  );
};
