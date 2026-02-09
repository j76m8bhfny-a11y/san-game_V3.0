import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { RegionID } from '@/types/schema';
import { SlumsScene } from './SlumsScene';

// 临时占位组件
const PlaceholderScene = ({ name }: { name: string }) => (
  <div className="w-full h-full flex items-center justify-center bg-gray-900 text-gray-500 font-pixel">
    🚧 {name} - UNDER CONSTRUCTION 🚧
  </div>
);

export const SceneManager: React.FC = () => {
  const { currentRegion } = useGameStore();

  switch (currentRegion) {
    case RegionID.Slums:
      return <SlumsScene />;
    
    // 后续开发其他区域时在这里添加
    case RegionID.RustBelt:
      return <PlaceholderScene name="RUST BELT" />;
    case RegionID.Suburbs:
      return <PlaceholderScene name="SUBURBS" />;
    case RegionID.Downtown:
      return <PlaceholderScene name="DOWNTOWN" />;
      
    default:
      return <SlumsScene />;
  }
};