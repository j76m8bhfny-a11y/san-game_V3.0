import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { NoviceActionType } from '@/types/schema';
import faithRulesUntyped from '@/assets/data/rules/faith_rules.json';
import { useI18n } from '@/i18n';

// 确保类型安全 (简单的类型定义，实际应从 types 引入)
const faithRules = faithRulesUntyped as any;

export const NoviceOptions: React.FC = () => {
  const { t } = useI18n();
  const { currentRegion, faith, performNoviceAction } = useGameStore();
  const { behaviorState } = faith;

  // 获取配置列表
  const mechanics = faithRules.noviceMechanics;
  const actionKeys = Object.keys(mechanics);

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
      <div className="bg-black/80 backdrop-blur-md p-6 rounded-xl border border-white/10 shadow-2xl pointer-events-auto min-w-[320px]">
        <h2 className="text-white font-serif text-xl mb-4 text-center tracking-widest border-b border-white/20 pb-2">
          {t('faith.make_choice')}
        </h2>
        
        <div className="flex flex-col gap-3">
          {actionKeys.map((key) => {
            const config = mechanics[key];
            // 获取当前区域的文案，如果没有则回退到 DEFAULT
            const flavor = config.regionFlavor[currentRegion] || config.regionFlavor['DEFAULT'];
            
            // 检查是否是当前连击项
            const isStreakActive = behaviorState.lastAction === key;
            const streakCount = isStreakActive ? behaviorState.currentStreak : 0;

            return (
              <button
                key={key}
                onClick={() => performNoviceAction(key as NoviceActionType)}
                className={`
                  relative group flex items-center justify-between p-4 rounded-lg border transition-all duration-200
                  ${isStreakActive 
                    ? 'bg-white/10 border-orange-500/50 shadow-[0_0_15px_rgba(249,115,22,0.2)]' 
                    : 'bg-black/40 border-white/5 hover:bg-white/5 hover:border-white/20'
                  }
                `}
              >
                {/* 左侧：标签与描述 */}
                <div className="text-left">
                  <div className={`font-bold text-sm ${isStreakActive ? 'text-orange-400' : 'text-gray-200 group-hover:text-white'}`}>
                    {flavor.label}
                  </div>
                  <div className="text-[10px] text-gray-500 group-hover:text-gray-400">
                    {flavor.desc}
                  </div>
                </div>

                {/* 右侧：连击计数器 (动态显示) */}
                {isStreakActive && streakCount > 0 && (
                  <div className="absolute -top-2 -right-2 bg-orange-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg animate-pulse">
                    x{streakCount}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-4 text-[10px] text-center text-gray-600 font-mono">
          "{t('faith.perseverance_quote')}"
        </div>
      </div>
    </div>
  );
};