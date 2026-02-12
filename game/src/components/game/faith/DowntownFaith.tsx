import React from 'react';
import { DowntownLodgeInterior } from './components/DowntownLodgeInterior';

interface Props {
  onClose: () => void;
}

export const DowntownFaith: React.FC<Props> = ({ onClose }) => {
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl" 
      onClick={onClose}
    >
      <div 
        className="w-full max-w-4xl aspect-[4/5] md:aspect-video bg-[#050505] shadow-[0_0_100px_rgba(0,0,0,1)] overflow-hidden border border-[#333] relative"
        onClick={e => e.stopPropagation()}
      >
        <DowntownLodgeInterior onClose={onClose} />
      </div>
    </div>
  );
};
