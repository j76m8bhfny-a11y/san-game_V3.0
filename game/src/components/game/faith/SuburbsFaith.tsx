import React from 'react';

import { SuburbsChurchInterior } from './components/SuburbsChurchInterior';

interface Props {
  onClose: () => void;
}

export const SuburbsFaith: React.FC<Props> = ({ onClose }) => {

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-solid-dark" 
      onClick={onClose}
    >
      <div 
        className="w-full max-w-5xl aspect-video bg-white shadow-pixel overflow-hidden border-4 border-gray-100 relative rounded-sm"
        onClick={e => e.stopPropagation()}
      >
        <SuburbsChurchInterior onClose={onClose} />
      </div>
    </div>
  );
};
