import React, { useMemo } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { FaithID } from '@/types/schema';
import faithsData from '@/assets/data/faiths.json';
// ✅ 1. 引入规则配置
import faithRules from '@/assets/data/rules/faithRules.json';

export const FaithSidebar: React.FC = () => {
  // ✅ 2. 解构 vitality 用于计算动态数值 (金钱等)
  const { isFaithOpen, setFaithOpen, faith, joinFaith, leaveFaith, performFaithRite, vitality, inventory } = useGameStore();

  const titheConfig = faithRules.mechanics.tithe;

  // ✅ 3. 动态计算什一税金额 (解耦核心逻辑)
  const titheAmount = useMemo(() => {
    if (faith.id !== titheConfig.targetFaithId) return 0;
    
    // 使用配置中的 rate 和 minAmount
    return Math.max(
      titheConfig.minAmount, 
      Math.floor(vitality.metrics.gold * titheConfig.rate)
    );
  }, [vitality.metrics.gold, faith.id, titheConfig]);

  // ✅ 4. 检查违禁品 (用于UI提示，逻辑层在 slice 中已有校验，但UI层需要同步反馈)
  const hasForbiddenItems = useMemo(() => {
    return inventory.some(itemId => faithRules.constraints.forbiddenItemIds.includes(itemId));
  }, [inventory]);

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
          {faithsData.map((data) => {
             // 针对兄弟会的特殊 UI 状态判断
             const isCleanJoin = data.joinCost.cleanInventory;
             const canJoin = !isCleanJoin || !hasForbiddenItems;

             return (
              <div key={data.id} className="border border-zinc-800 p-4 hover:border-zinc-500 transition-colors group">
                <h3 className={`font-bold text-lg ${data.color}`}>{data.name}</h3>
                <p className="text-xs text-zinc-500 mt-1 mb-3">{data.description}</p>
                
                <div className="text-[10px] text-zinc-600 space-y-1 mb-4 border-l-2 border-zinc-800 pl-2">
                   <div>
                     入会: {data.joinCost.gold ? `$${data.joinCost.gold}` : (isCleanJoin ? '需身家清白' : '无偿')}
                     {/* 违禁品警告 */}
                     {isCleanJoin && hasForbiddenItems && (
                       <span className="text-red-500 ml-2 block">
                         ⚠ 检测到违禁品 ({faithRules.constraints.forbiddenItemIds.join(', ')})
                       </span>
                     )}
                   </div>
                   <div>仪式: {data.rite.name}</div>
                </div>

                <button 
                  onClick={() => joinFaith(data.id as FaithID)}
                  disabled={!canJoin}
                  className={`w-full py-2 text-xs font-bold border transition-all
                    ${canJoin 
                      ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-800 group-hover:border-zinc-600' 
                      : 'bg-red-900/10 text-red-700 border-red-900/30 cursor-not-allowed'}
                  `}
                >
                  {canJoin ? 'JOIN' : '不可加入'}
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        // --- 已入教界面 ---
        currentFaithData && (
            <div className="flex flex-col h-full pb-20">
              <div className={`text-center py-8 border-b-2 ${currentFaithData.color.replace('text', 'border')} mb-8`}>
                 <h2 className={`text-3xl font-black ${currentFaithData.color} mb-2`}>{currentFaithData.name}</h2>
                 <div className={`w-20 h-20 mx-auto my-4 rounded-full border-2 ${currentFaithData.color.replace('text', 'border')} flex items-center justify-center text-5xl animate-pulse`}>
                   {/* 这里可以放个 Icon 或者 首字母 */}
                   {currentFaithData.name[0]}
                 </div>
                 <p className="text-sm text-zinc-400 px-2 italic">
                   "{currentFaithData.description}"
                 </p>
              </div>

              <div className="space-y-4">
                {/* ✅ 动态描述区域 */}
                <div className="text-xs text-center text-zinc-500 min-h-[1.5em]">
                    {/* 如果是教会且规则匹配，显示动态计算的文本，否则显示默认描述 */}
                    {faith.id === titheConfig.targetFaithId ? (
                        <span className="text-yellow-500/80">
                           {/* 引用配置中的文本模板并替换变量 */}
                           {titheConfig.description.replace('${amount}', titheAmount.toString())}
                           <span className="block text-[10px] text-zinc-600 mt-1">
                             (当前费率: {titheConfig.rate * 100}%, 最低: ${titheConfig.minAmount})
                           </span>
                        </span>
                    ) : (
                        currentFaithData.rite.description
                    )}
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
                    <span>{faithRules.text.riteDone || "今日已完成"}</span>
                  ) : (
                    <span className="flex flex-col items-center">
                      <span>[ {currentFaithData.rite.name} ]</span>
                      {/* 如果是教会，在按钮上也显示金额提示 */}
                      {faith.id === titheConfig.targetFaithId && (
                         <span className="text-xs font-normal mt-1 opacity-80">-${titheAmount}</span>
                      )}
                    </span>
                  )}
                </button>

                <button 
                  onClick={leaveFaith}
                  className="w-full py-2 text-xs text-zinc-600 hover:text-red-900 mt-4 border border-transparent hover:border-red-900/30"
                >
                  {/* 使用配置中的文本 (如果需要，目前是静态 "背叛信仰") */}
                  背叛信仰
                </button>
              </div>
            </div>
        )
      )}
    </div>
  );
};