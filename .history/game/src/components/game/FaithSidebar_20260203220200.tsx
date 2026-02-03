import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { FaithID } from '@/types/schema';
import faithsData from '@/assets/data/faiths.json';

export const FaithSidebar: React.FC = () => {
  const { isFaithOpen, setFaithOpen, faith, joinFaith, leaveFaith, performFaithRite } = useGameStore();

  if (!isFaithOpen) return null;

  const currentFaithData = faithsData.find(f => f.id === faith.id);

  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-black/95 border-l border-zinc-800 p-6 z-50 text-white overflow-y-auto font-mono">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-xl font-bold tracking-widest text-zinc-400">FAITH // 信仰</h2>
        <button onClick={() => setFaithOpen(false)} className="text-zinc-500 hover:text-white">✕</button>
      </div>

      {faith.id === FaithID.NONE ? (
        // --- 未入教列表 ---
        <div className="space-y-6">
          <p className="text-sm text-zinc-500 mb-4">在这个绝望的世界，你需要一种精神寄托...</p>
          {faithsData.map((data) => (
            <div key={data.id} className="border border-zinc-800 p-4 hover:border-zinc-500 transition-colors group">
              <h3 className={`font-bold text-lg ${data.color}`}>{data.name}</h3>
              <p className="text-xs text-zinc-500 mt-1 mb-3">{data.description}</p>
              
              <div className="text-[10px] text-zinc-600 space-y-1 mb-4 border-l-2 border-zinc-800 pl-2">
                 <div>入会: {data.joinCost.gold ? `$${data.joinCost.gold}` : '无偿'}</div>
                 <div>仪式: {data.rite.name}</div>
              </div>

              <button 
                onClick={() => joinFaith(data.id as FaithID)}
                className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-bold border border-zinc-800 group-hover:border-zinc-600 transition-all"
              >
                JOIN
              </button>
            </div>
          ))}
        </div>
      ) : (
        // --- 已入教界面 ---
        currentFaithData && (
            <div className="flex flex-col h-full pb-20">
              <div className={`text-center py-8 border-b-2 ${currentFaithData.color.replace('text', 'border')} mb-8`}>
                 <h2 className={`text-3xl font-black ${currentFaithData.color} mb-2`}>{currentFaithData.name}</h2>
                 <div className={`w-20 h-20 mx-auto my-4 rounded-full border-2 ${currentFaithData.color.replace('text', 'border')} flex items-center justify-center text-5xl animate-pulse`}>
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
                
                {/* 仪式按钮 */}
                <button
                  disabled={faith.hasPerformedRite}
                  onClick={() => performFaithRite()}
                  className={`w-full py-4 text-lg font-bold border-2 transition-all relative overflow-hidden group
                    ${faith.hasPerformedRite 
                      ? 'border-zinc-800 text-zinc-600 cursor-not-allowed bg-zinc-900/50'
                      : `border-white hover:bg-white hover:text-black ${currentFaithData.color.replace('text', 'border')}`
                    }
                  `}
                >
                  {faith.hasPerformedRite ? (
                    <span>今日已完成</span>
                  ) : (
                    <span>[ {currentFaithData.rite.name} ]</span>
                  )}
                </button>

                <button 
                  onClick={leaveFaith}
                  className="w-full py-2 text-xs text-zinc-600 hover:text-red-900 mt-4 border border-transparent hover:border-red-900/30"
                >
                  背叛信仰
                </button>
              </div>
            </div>
        )
      )}
    </div>
  );
};