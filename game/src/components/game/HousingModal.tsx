import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { RegionID } from '@/types/schema';


import { SlumsHousing } from './housing/SlumsHousing';
import { RustBeltHousing } from './housing/RustBeltHousing';


import { SuburbsHousing } from './housing/SuburbsHousing';
import { DowntownHousing } from './housing/DowntownHousing';

interface HousingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HousingModal: React.FC<HousingModalProps> = ({ isOpen, onClose }) => {
  const { currentRegion } = useGameStore();

  if (!isOpen) return null;

  // 根据当前区域，路由到不同的沉浸式界面
  switch (currentRegion) {
    case RegionID.Slums:
      return <SlumsHousing onClose={onClose} />;
    

    
    case RegionID.RustBelt:
       return <RustBeltHousing onClose={onClose} />;

    case RegionID.Suburbs:
      return <SuburbsHousing onClose={onClose} />;

    case RegionID.Downtown:
      return <DowntownHousing onClose={onClose} />;
    
    default:
      // 所有区域已完成，此处不应触发
      return null;
  }
};