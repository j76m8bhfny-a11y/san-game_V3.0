import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { RegionID } from '@/types/schema';

import { SlumsScene } from './SlumsScene';
import { RustBeltScene } from './RustBeltScene';
import { SuburbsScene } from './SuburbsScene';
import { DowntownScene } from './DowntownScene';

export const SceneManager: React.FC = () => {
  const { currentRegion } = useGameStore();

  switch (currentRegion) {
    case RegionID.Slums:
      return <SlumsScene />;
    case RegionID.RustBelt:
      return <RustBeltScene />;
    case RegionID.Suburbs:
      return <SuburbsScene />;
    case RegionID.Downtown:
      return <DowntownScene />;
    default:
      return <SlumsScene />;
  }
};