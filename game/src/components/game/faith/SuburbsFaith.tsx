import React from 'react';
import { useI18n } from '@/i18n';
import { SuburbsChurchInterior } from './components/SuburbsChurchInterior';

interface Props {
  onClose: () => void;
}

export const SuburbsFaith: React.FC<Props> = ({ onClose }) => {
  const { t } = useI18n();
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md" 
      onClick={onClose}
    >
      <div 
        className="w-full max-w-5xl aspect-video bg-white shadow-2xl overflow-hidden border-4 border-gray-100 relative rounded-xl"
        onClick={e => e.stopPropagation()}
      >
        <SuburbsChurchInterior onClose={onClose} />
      </div>
    </div>
  );
};
