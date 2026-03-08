import React from 'react';
import { useI18n } from '@/i18n';
import { useGameStore } from '@/store/useGameStore';
import { RegionID } from '@/types/schema';
import { SlumsBank } from './bank/SlumsBank';
import { SuburbsBank } from './bank/SuburbsBank';
import { DowntownBank } from './bank/DowntownBank';
import { RustBeltBank } from './bank/RustBeltBank';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const BankModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { t } = useI18n();
  const { currentRegion } = useGameStore();

  if (!isOpen) return null;

  switch (currentRegion) {
    case RegionID.Slums:
      return <SlumsBank onClose={onClose} />;
    case RegionID.Suburbs:
      return <SuburbsBank onClose={onClose} />;
    case RegionID.Downtown:
      return <DowntownBank onClose={onClose} />;
    case RegionID.RustBelt:
      return <RustBeltBank onClose={onClose} />;
    default:
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-solid-dark" onClick={onClose}>
          <div className="bg-gray-800 p-8 rounded-sm border border-gray-600 text-center">
            <h2 className="text-xl text-white mb-2 font-mono">{t('bank.title')}</h2>
            <p className="text-gray-400 mb-4">{t('bank.underRenovation', { region: currentRegion })}</p>
            <button 
              onClick={onClose}
              className="px-4 py-2 bg-white text-black font-bold rounded hover:bg-gray-200"
            >
              {t('common.close')}
            </button>
          </div>
        </div>
      );
  }
};