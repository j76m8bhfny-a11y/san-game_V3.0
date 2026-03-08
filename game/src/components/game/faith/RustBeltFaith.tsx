import React from 'react';

import { RustBeltChurchInterior } from './components/RustBeltChurchInterior';

interface Props {
  onClose: () => void;
}

export const RustBeltFaith: React.FC<Props> = ({ onClose }) => {

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-solid-dark" 
      onClick={onClose}
    >
      <div 
        className="w-full max-w-4xl aspect-video bg-[#111] shadow-pixel overflow-hidden border-4 border-[#333] relative"
        onClick={e => e.stopPropagation()}
      >
        <RustBeltChurchInterior onClose={onClose} />
      </div>
    </div>
  );
};
