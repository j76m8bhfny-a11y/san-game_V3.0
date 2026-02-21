import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlayerClass } from '@/types/schema';
import { useGameStore } from '@/store/useGameStore';
import { useI18n } from '@/i18n';
// ✅ 1. 引入新规则配置 (请确保文件路径正确)
import rules from '@/assets/data/rules/vitality_rules.json';

interface ClassSelectorProps {
  onConfirm: () => void;
}

// ✅ 2. 定义视觉映射 (UI Config)
// 这样可以将"数值"放在 JSON 里，"长相"放在组件里，通过 ID 关联
const CLASS_VISUALS: Record<PlayerClass, { color: string; border: string }> = {
  [PlayerClass.Homeless]: { 
    color: 'text-gray-400', 
    border: 'border-gray-600' 
  },
  [PlayerClass.Worker]: { 
    color: 'text-blue-400', 
    border: 'border-blue-500' 
  },
  [PlayerClass.Middle]: { 
    color: 'text-purple-400', 
    border: 'border-purple-500' 
  },
  [PlayerClass.Capitalist]: { 
    color: 'text-yellow-400', 
    border: 'border-yellow-500' 
  }
};

const CLASS_NAME_KEYS: Record<PlayerClass, string> = {
  [PlayerClass.Homeless]: 'hud.class.homeless.label',
  [PlayerClass.Worker]: 'hud.class.worker.label',
  [PlayerClass.Middle]: 'hud.class.middle.label',
  [PlayerClass.Capitalist]: 'hud.class.capitalist.label'
};

export const ClassSelectorModal: React.FC<ClassSelectorProps> = ({ onConfirm }) => {
  const { t } = useI18n();
  const initGame = useGameStore(state => state.initGame);
  const [selected, setSelected] = useState<PlayerClass | null>(null);

  const handleConfirm = () => {
    if (selected && initGame) {
      initGame(selected);
      onConfirm();
    }
  };

  // ✅ 3. 动态生成列表 (合并 JSON 数值 + 本地 UI 配置)
  const classList = Object.entries(rules.classes).map(([key, stats]) => {
    // 强制类型转换，确保 key 被识别为 PlayerClass 枚举
    const classId = key as PlayerClass;
    const visual = CLASS_VISUALS[classId] || { color: 'text-white', border: 'border-white' };

    return {
      id: classId,
      // 从国际化取名称
      name: t(CLASS_NAME_KEYS[classId]), 
      color: visual.color, 
      border: visual.border,
      // 从 JSON 规则取 (注意：TS 可能不知道 stats 的具体结构，这里视为 any 或需定义接口)
      desc: (stats as any).desc || 'No description', 
      gold: (stats as any).gold || 0,
      hp: (stats as any).hp || 0,
      insight: (stats as any).insight || 0
    };
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4">
      <h2 className="text-3xl font-pixel text-green-500 mb-8 tracking-widest">
        {t('classSelector.title')}
      </h2>
      <p className="text-sm text-gray-400 font-mono mb-8">
        {t('classSelector.subtitle')}
      </p>

      {/* ✅ 4. 修复变量名引用: classes -> classList */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-5xl mb-12">
        {classList.map((cls) => {
          const isSelected = selected === cls.id;

          return (
            <motion.button
              key={cls.id}
              onClick={() => setSelected(cls.id)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`
                relative p-6 h-64 flex flex-col justify-between text-left
                border-2 transition-all duration-300 group overflow-hidden
                ${isSelected ? `${cls.border} bg-white/5` : 'border-white/10 hover:border-white/30'}
              `}
            >
              <div>
                <div className={`text-xl font-bold font-pixel mb-2 ${isSelected ? cls.color : 'text-gray-500'}`}>
                  {cls.name}
                </div>
                {/* 这里的 desc 来自 JSON */}
                <div className="text-xs text-gray-400 font-mono leading-relaxed opacity-80">
                  {cls.desc} 
                </div>
              </div>

              <div className="space-y-2 font-mono text-sm">
                <div className="flex justify-between border-b border-white/10 pb-1">
                  <span className="text-gray-500">{t('classSelector.stats.initial')}</span>
                  <span className={cls.color}>${cls.gold}</span>
                </div>
                <div className="flex justify-between border-b border-white/10 pb-1">
                  <span className="text-gray-500">{t('classSelector.stats.insight')}</span>
                  <span className={cls.color}>{cls.insight}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">{t('classSelector.stats.hp')}</span>
                  <span className={cls.color}>{cls.hp}</span>
                </div>
              </div>

              {/* 角标装饰 */}
              <div className={`absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 transition-colors ${isSelected ? cls.border : 'border-transparent'}`} />
              <div className={`absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 transition-colors ${isSelected ? cls.border : 'border-transparent'}`} />
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence>
        {selected && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            onClick={handleConfirm}
            className="px-12 py-4 bg-green-600 text-black font-pixel font-bold text-xl hover:bg-green-500 transition-colors shadow-[0_0_20px_rgba(22,163,74,0.5)]"
            style={{ clipPath: 'polygon(10% 0, 100% 0, 100% 70%, 90% 100%, 0 100%, 0 30%)' }}
          >
            {t('classSelector.select')}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};