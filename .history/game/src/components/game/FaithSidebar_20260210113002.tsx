import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { RegionID } from '@/types/schema';

// 引入之前设计好的贫民窟宗教组件 (上一轮对话的代码)
import { SlumsFaith } from './faith/SlumsFaith';

// 引入其他阶级的组件 (占位符，后续逐步实现)
import { RustBeltFaith } from './faith/RustBeltFaith';
import { SuburbsFaith } from './faith/SuburbsFaith';
import { DowntownFaith } from './faith/DowntownFaith';

export const FaithSidebar: React.FC = () => {
  const { isFaithOpen, setFaithOpen, currentRegion } = useGameStore();

  if (!isFaithOpen) return null;

  const handleClose = () => setFaithOpen(false);

  // 渲染逻辑：根据当前所在的地图区域，加载对应的拟物化宗教界面
  const renderContent = () => {
    switch (currentRegion) {
      case RegionID.Slums:
        // 贫民窟 -> 街头祭坛 (献祭与交易)
        return <SlumsFaith onClose={handleClose} />;
      
      case RegionID.RustBelt:
        // 工人区 -> 路边福音堂 (狂热与捐献)
        return <RustBeltFaith onClose={handleClose} />;
        

      case RegionID.Suburbs:
        // 中产区 -> 现代社区教会 (社交与订阅)
        return <SuburbsFaith onClose={handleClose} />;

      case RegionID.Downtown:
        // 核心区 -> 精英兄弟会 (契约与权力)
        return <DowntownFaith onClose={handleClose} />;

      default:
        return <div className="text-white p-4">此处没有宗教场所。</div>;
    }
  };

  return (
    // 注意：这里不再是侧边栏 (w-80)，而是全屏遮罩，因为新的设计是沉浸式场景
    // 之前的 sidebar 样式被新的组件内部样式接管了
    <>
      {renderContent()}
    </>
  );
};

// --- 临时占位组件 (用于还未开发的区域) ---
const PlaceholderFaith: React.FC<{ region: string; name: string }> = ({ region, name }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
    <div className="border border-zinc-700 bg-zinc-900 p-8 max-w-md text-center">
      <h2 className="text-2xl font-bold text-zinc-400 mb-2">{name}</h2>
      <p className="text-zinc-600 font-mono text-sm mb-6">
        LOCATION: {region}<br/>
        STATUS: UNDER RENOVATION
      </p>
      <button 
        onClick={() => useGameStore.getState().setFaithOpen(false)}
        className="px-6 py-2 border border-zinc-600 hover:bg-zinc-800 text-zinc-300"
      >
        [ 离开 ]
      </button>
    </div>
  </div>
);