import React from 'react';
import { useI18n } from '@/i18n';
import { RustBeltChurchInterior } from './components/RustBeltChurchInterior';

interface Props {
  onClose: () => void;
}

export const RustBeltFaith: React.FC<Props> = ({ onClose }) => {
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
        <RustBeltChurchInterior onClose={onClose} />
      </div>
    </div>
  );
};
