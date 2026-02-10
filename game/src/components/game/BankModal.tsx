import React from 'react';
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm" onClick={onClose}>
          <div className="bg-gray-800 p-8 rounded-lg border border-gray-600 text-center">
            <h2 className="text-xl text-white mb-2 font-mono">BANK SYSTEM</h2>
            <p className="text-gray-400 mb-4">The bank for {currentRegion} is under renovation.</p>
            <button 
              onClick={onClose}
              className="px-4 py-2 bg-white text-black font-bold rounded hover:bg-gray-200"
            >
              CLOSE
            </button>
          </div>
        </div>
      );
  }
};