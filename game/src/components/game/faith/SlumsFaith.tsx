import React from 'react';
import { useI18n } from '@/i18n';
import { SlumsShrineInterior } from './components/SlumsShrineInterior';

interface Props {
  onClose: () => void;
}

export const SlumsFaith: React.FC<Props> = ({ onClose }) => {
  const { t } = useI18n();
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm" 
      onClick={onClose}
    >
      <div 
        className="w-full max-w-4xl aspect-video bg-[#111] shadow-2xl overflow-hidden border-4 border-[#333] relative"
        onClick={e => e.stopPropagation()}
      >
        <SlumsShrineInterior onClose={onClose} />
      </div>
    </div>
  );
};
