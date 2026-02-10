import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { RegionID } from '@/types/schema';

// 引入我们刚写好的贫民窟住房组件
import { SlumsHousing } from './housing/SlumsHousing';
import { RustBeltHousing } from './housing/RustBeltHousing'; // 引入组件

// 如果你以后做好了其他区域的组件，就在这里引入
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
    
    // TODO: 下面这些区域的组件等你之后做好了，把注释解开即可
    
    case RegionID.RustBelt:
       return <RustBeltHousing onClose={onClose} />;

    case RegionID.Suburbs:
      return <SuburbsHousing onClose={onClose} />;

    case RegionID.Downtown:
      return <DowntownHousing onClose={onClose} />;
    
    default:
      // 对于还没完成 UI 设计的区域，显示一个临时占位符
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 text-white backdrop-blur-sm" onClick={onClose}>
          <div className="border border-white/20 p-8 bg-[#111] max-w-md text-center" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-yellow-500 mb-4">🚧 AREA UNDER CONSTRUCTION 🚧</h2>
            <p className="font-mono text-gray-400 mb-6">
              The housing system for <span className="text-white font-bold">{currentRegion}</span> is currently being renovated by the developers.
            </p>
            <button 
              onClick={onClose}
              className="px-4 py-2 bg-white text-black font-bold hover:bg-gray-200"
            >
              [ LEAVE ]
            </button>
          </div>
        </div>
      );
  }
};