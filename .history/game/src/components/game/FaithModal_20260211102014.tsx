import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { RegionID, FaithID } from '@/types/schema';

// 1. 引入新手选项组件
import { NoviceOptions } from './faith/NoviceOptions';

// 2. 引入完整功能组件 (Believer 模式用)
import { SlumsFaith } from './faith/SlumsFaith';
import { RustBeltFaith } from './faith/RustBeltFaith';
import { SuburbsFaith } from './faith/SuburbsFaith';
import { DowntownFaith } from './faith/DowntownFaith';

// 3. 引入纯外观组件 (Novice 模式当背景用)
// 注意：我们需要给这些组件传 dummy props 避免报错，或者确保它们能作为纯展示组件运行
import { SlumsShrineExterior } from './faith/components/SlumsShrineExterior';
import { RustBeltChurchExterior } from './faith/components/RustBeltChurchExterior';
import { SuburbsChurchExterior } from './faith/components/SuburbsChurchExterior';
import { DowntownLodgeExterior } from './faith/components/DowntownLodgeExterior';

export const FaithModal: React.FC = () => {
  const { isFaithOpen, setFaithOpen, currentRegion, faith } = useGameStore();

  if (!isFaithOpen) return null;

  const handleClose = () => setFaithOpen(false);
  const isNovice = faith.id === FaithID.NONE;

  // 渲染内容逻辑
  const renderContent = () => {
    // A. 如果是信徒，渲染完整的区域宗教功能
    if (!isNovice) {
      switch (currentRegion) {
        case RegionID.Slums: return <SlumsFaith onClose={handleClose} />;
        case RegionID.RustBelt: return <RustBeltFaith onClose={handleClose} />;
        case RegionID.Suburbs: return <SuburbsFaith onClose={handleClose} />;
        case RegionID.Downtown: return <DowntownFaith onClose={handleClose} />;
        default: return null;
      }
    }

    // B. 如果是新手，渲染 "背景 + 选项"
    // 我们复用 Exterior 组件作为背景，并覆盖 NoviceOptions
    const renderBackground = () => {
      // 传入空的 onEnter 覆盖原有交互，onClose 仍然有效
      const bgProps = { onEnter: () => {}, onClose: handleClose };
      
      switch (currentRegion) {
        case RegionID.Slums: return <SlumsShrineExterior {...bgProps} />;
        case RegionID.RustBelt: return <RustBeltChurchExterior {...bgProps} />;
        case RegionID.Suburbs: return <SuburbsChurchExterior {...bgProps} />;
        case RegionID.Downtown: return <DowntownLodgeExterior {...bgProps} />;
        default: return <div className="bg-black w-full h-full" />;
      }
    };

    return (
      <div className="relative w-full h-full">
        {/* 层级 1: 背景 (复用现有组件，保持沉浸感) */}
        <div className="absolute inset-0 z-0 pointer-events-none filter brightness-50 grayscale-[0.3]">
           {/* 注意：我们需要稍微禁用背景的交互，因为焦点在 NoviceOptions 上 */}
           {renderBackground()}
        </div>
        
        {/* 层级 2: 关闭按钮 (作为逃生舱，以防背景的按钮被遮挡或不可用) */}
        <button 
            onClick={handleClose}
            className="absolute top-4 right-4 z-40 text-gray-400 hover:text-white font-mono text-xs border border-white/20 px-3 py-1 rounded"
        >
            [CLOSE]
        </button>

        {/* 层级 3: 新手选项菜单 */}
        <NoviceOptions />
      </div>
    );
  };

  return (
    // 全屏遮罩容器
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm" onClick={handleClose}>
       <div 
         className="w-full max-w-5xl aspect-video relative overflow-hidden shadow-2xl border border-gray-800 bg-black"
         onClick={e => e.stopPropagation()} // 防止点击内部关闭
       >
         {renderContent()}
       </div>
    </div>
  );
};