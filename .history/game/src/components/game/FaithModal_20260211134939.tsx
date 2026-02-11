import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { RegionID } from '@/types/schema';

// 引入区域宗教容器组件
// 这些组件内部会自动处理 Novice / Native / Guest 模式
import { SlumsFaith } from './faith/SlumsFaith';
import { RustBeltFaith } from './faith/RustBeltFaith';
import { SuburbsFaith } from './faith/SuburbsFaith';
import { DowntownFaith } from './faith/DowntownFaith';

export const FaithModal: React.FC = () => {
  const { isFaithOpen, setFaithOpen, currentRegion } = useGameStore();

  if (!isFaithOpen) return null;

  const handleClose = () => setFaithOpen(false);

  // 渲染逻辑：直接路由到对应区域的宗教组件
  // 不再在这一层做 "isNovice" 的判断，避免阻断新设计的 UI
  const renderContent = () => {
    switch (currentRegion) {
      case RegionID.Slums:
        // 贫民窟 -> 街头祭坛 (自动处理：扔钱/献祭/冥想)
        return <SlumsFaith onClose={handleClose} />;
      
      case RegionID.RustBelt:
        // 工人区 -> 路边福音堂 (自动处理：传单勾选/狂热布道)
        return <RustBeltFaith onClose={handleClose} />;

      case RegionID.Suburbs:
        // 郊区 -> 社区教会 (自动处理：iPad App/会员订阅)
        return <SuburbsFaith onClose={handleClose} />;

      case RegionID.Downtown:
        // 核心区 -> 兄弟会 (自动处理：意向书/血契/访客登记)
        return <DowntownFaith onClose={handleClose} />;

      default:
        return (
          <div className="flex items-center justify-center w-full h-full text-white font-mono">
            [ERROR: UNKNOWN REGION FAITH]
          </div>
        );
    }
  };

  return (
    // 全屏遮罩容器
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm" 
      onClick={handleClose}
    >
       <div 
         className="w-full max-w-5xl aspect-video relative overflow-hidden shadow-2xl border border-gray-800 bg-black"
         onClick={e => e.stopPropagation()} // 防止点击内部关闭
       >
         {renderContent()}
       </div>
    </div>
  );
};