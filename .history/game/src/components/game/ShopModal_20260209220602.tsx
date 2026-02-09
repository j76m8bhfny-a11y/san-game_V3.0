import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { RegionID } from '@/types/schema';
import { SlumsShop } from './shops/SlumsShop';
import { RustBeltShop } from './shops/RustBeltShop'; // 引入组件

// 临时占位组件，用于其他阶级还没做好的时候
const PlaceholderShop = ({ region, onClose }: { region: string; onClose: () => void }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90" onClick={onClose}>
    <div className="text-white font-mono border border-white p-8">
      <h1 className="text-2xl mb-4">🚧 {region} SHOP 🚧</h1>
      <p>Under Construction...</p>
    </div>
  </div>
);

export const ShopModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { currentRegion } = useGameStore();

  if (!isOpen) return null;

  switch (currentRegion) {
    case RegionID.Slums:
      return <SlumsShop onClose={onClose} />;
    
    // 后续在这里添加其他阶级的商店
    case RegionID.RustBelt: return <RustBeltShop onClose={onClose} />;
    // case RegionID.Suburbs: return <SuburbsShop onClose={onClose} />;
    // case RegionID.Downtown: return <DowntownShop onClose={onClose} />;
    
    default:
      return <PlaceholderShop region={currentRegion} onClose={onClose} />;
  }
};