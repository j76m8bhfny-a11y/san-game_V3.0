import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { RegionID } from '@/types/schema';
import { useI18n } from '@/i18n';

// 引入各区域的完整功能组件
// 这些组件内部已经封装了：
// 1. Exterior (门外) vs Interior (门内) 的切换
// 2. Interior 内部的 Novice (新手) vs Native (主场) vs Guest (客场) 逻辑
import { SlumsFaith } from './faith/SlumsFaith';
import { RustBeltFaith } from './faith/RustBeltFaith';
import { SuburbsFaith } from './faith/SuburbsFaith';
import { DowntownFaith } from './faith/DowntownFaith';

export const FaithModal: React.FC = () => {
  const { isFaithOpen, setFaithOpen, currentRegion } = useGameStore();
  const { t } = useI18n();

  if (!isFaithOpen) return null;

  const handleClose = () => setFaithOpen(false);

  // 渲染逻辑：根据当前所在的地图区域，加载对应的区域宗教模块
  const renderContent = () => {
    switch (currentRegion) {
      case RegionID.Slums:
        // 贫民窟 -> 街头祭坛
        return <SlumsFaith onClose={handleClose} />;
      
      case RegionID.RustBelt:
        // 铁锈区 -> 福音堂/工会大厅
        return <RustBeltFaith onClose={handleClose} />;

      case RegionID.Suburbs:
        // 郊区 -> 社区教会
        return <SuburbsFaith onClose={handleClose} />;

      case RegionID.Downtown:
        // 核心区 -> 兄弟会会所
        return <DowntownFaith onClose={handleClose} />;

      default:
        return (
          <div className="flex items-center justify-center h-full text-white/50 font-mono">
            {t('faith.noSite')}
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
       {/* 内容容器 
         aspect-video 保持 16:9 的电影感比例
         max-w-5xl 限制最大宽度，避免在大屏上太散
       */}
       <div 
         className="w-full max-w-5xl aspect-video relative overflow-hidden shadow-2xl border border-gray-800 bg-black"
         onClick={e => e.stopPropagation()} // 防止点击内部触发关闭
       >
         {renderContent()}
       </div>
    </div>
  );
};