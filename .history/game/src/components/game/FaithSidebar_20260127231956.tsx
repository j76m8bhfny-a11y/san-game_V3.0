import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { useUIStore } from '../../store/slices/createUISlice';
import { FaithID } from '../../types/schema';
import faithsData from '../../assets/data/faiths.json'; // 直接读 JSON 渲染

const FaithSidebar: React.FC = () => {
  const { isFaithOpen, setFaithOpen } = useUIStore();
  const { faith, joinFaith, leaveFaith, performFaithRite } = useGameStore();

  if (!isFaithOpen) return null;

  // 获取当前信仰的配置数据
  const currentFaithData = faithsData.find(f => f.id === faith.id);

  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-black/95 border-l border-zinc-800 p-6 z-50 text-white overflow-y-auto font-mono">
      {/* 标题栏 */}
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-xl font-bold tracking-widest text-zinc-400">FAITH // 信仰</h2>
        <button onClick={() => setFaithOpen(false)} className="text-zinc-500 hover:text-white">✕</button>
      </div>

      {faith.id === FaithID.NONE ? (
        // --- 未入教列表 ---
        <div className="space-y-6">
          <p className="text-sm text-zinc-500 mb-4">在这个绝望的世界，你需要一种精神寄托...</p>
          {faithsData.map((data) => (
            <div key={data.id} className="border border-zinc-800 p-4 rounded hover:bg-zinc-900 transition-colors">
              <h3 className={`font-bold ${data.color}`}>{data.name}</h3>
              <p className="text-xs text-zinc-400 mt-1 mb-3">{data.description}</p>
              
              {/* 显示消耗提示 */}
              <div className="text-[10px] text-zinc-600 mb-2">
                入教条件: 
                {data.joinCost.gold && ` $${data.joinCost.gold}`}
                {data.joinCost.cleanInventory && ` 无违禁品`}
                {data.joinCost.minHp && ` HP>${data.joinCost.minHp}`}
                {data.joinCost.minSan && ` SAN>${data.joinCost.minSan}`}
                {data.joinCost.maxSan && ` SAN<${data.joinCost.maxSan}`}
              </div>

              <button 
                onClick={() => {
                   const res = joinFaith(data.id as FaithID);
                   if (!res.success) alert(res.message); // 后续可换成 Toast
                }}
                className="w-full py-1 text-xs border border-zinc-700 hover:bg-white hover:text-black transition-all"
              >
                皈依
              </button>
            </div>
          ))}
        </div>
      ) : (
        // --- 已入教视图 ---
        <div className="flex flex-col h-[80%]">
          {currentFaithData && (
            <>
              <div className="flex-1 text-center space-y-6 mt-10">
                 <h2 className={`text-2xl font-black ${currentFaithData.color}`}>
                   {currentFaithData.name}
                 </h2>
                 <div className={`w-32 h-32 mx-auto border-4 border-double ${currentFaithData.color.replace('text', 'border')} rounded-full flex items-center justify-center text-5xl animate-pulse`}>
                   Wait
                 </div>
                 <p className="text-sm text-zinc-400 px-2 italic">
                   "{currentFaithData.description}"
                 </p>
              </div>

              <div className="space-y-4">
                <div className="text-xs text-center text-zinc-500">
                    {currentFaithData.rite.description}
                </div>
                <button
                  disabled={faith.hasPerformedRite}
                  onClick={() => {
                    const res = performFaithRite();
                    alert(res.message);
                  }}
                  className={`w-full py-4 text-lg font-bold border-2 transition-all
                    ${faith.hasPerformedRite 
                      ? 'border-zinc-800 text-zinc-600 cursor-not-allowed'
                      : `border-white hover:bg-white hover:text-black ${currentFaithData.color.replace('text', 'border')}`
                    }
                  `}
                >
                  {faith.hasPerformedRite ? '今日已完成' : `[ ${currentFaithData.rite.name} ]`}
                </button>

                <button 
                  onClick={leaveFaith}
                  className="w-full py-2 text-xs text-zinc-600 hover:text-red-900 mt-4"
                >
                  背叛信仰
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default FaithSidebar;