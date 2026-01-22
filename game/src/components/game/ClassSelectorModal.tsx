import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlayerClass } from '@/types/schema';
import { useGameStore } from '@/store/useGameStore';
// 确保这里引入路径正确
import { CLASS_INITIAL_STATS } from '@/store/slices/createPlayerSlice';

interface ClassSelectorProps {
  onConfirm: () => void;
}

// ⚠️ 重点：必须有 'export' 关键字
export const ClassSelectorModal: React.FC<ClassSelectorProps> = ({ onConfirm }) => {
  const startGame = useGameStore(state => state.startGame);
  const [selected, setSelected] = useState<PlayerClass | null>(null);

  const handleConfirm = () => {
    if (selected) {
      startGame(selected);
      onConfirm();
    }
  };

  const classes = [
    { id: PlayerClass.Homeless, name: '流浪汉', color: 'text-gray-400', border: 'border-gray-600' },
    { id: PlayerClass.Worker, name: '打工人', color: 'text-blue-400', border: 'border-blue-500' },
    { id: PlayerClass.Middle, name: '中产阶级', color: 'text-purple-400', border: 'border-purple-500' },
    { id: PlayerClass.Capitalist, name: '资本家', color: 'text-yellow-400', border: 'border-yellow-500' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4">
      <h2 className="text-3xl font-pixel text-green-500 mb-8 tracking-widest glitch-text" data-text="SELECT IDENTITY">
        SELECT IDENTITY
      </h2>

      {/* 卡片容器 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-5xl mb-12">
        {classes.map((cls) => {
          const stats = CLASS_INITIAL_STATS[cls.id];
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
              {/* 选中时的扫描线背景 */}
              {isSelected && (
                <div className="absolute inset-0 bg-scanlines opacity-20 pointer-events-none" />
              )}

              <div>
                <div className={`text-xl font-bold font-pixel mb-2 ${isSelected ? cls.color : 'text-gray-500'}`}>
                  {cls.name}
                </div>
                <div className="text-xs text-gray-400 font-mono leading-relaxed opacity-80">
                  {stats?.desc || 'Loading...'} 
                </div>
              </div>

              <div className="space-y-2 font-mono text-sm">
                <div className="flex justify-between border-b border-white/10 pb-1">
                  <span className="text-gray-500">GOLD</span>
                  <span className={cls.color}>${stats?.gold || 0}</span>
                </div>
                <div className="flex justify-between border-b border-white/10 pb-1">
                  <span className="text-gray-500">SAN</span>
                  <span className={cls.color}>{stats?.san || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">HP</span>
                  <span className={cls.color}>{stats?.hp || 0}</span>
                </div>
              </div>

              {/* 角标装饰 */}
              <div className={`absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 transition-colors ${isSelected ? cls.border : 'border-transparent'}`} />
              <div className={`absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 transition-colors ${isSelected ? cls.border : 'border-transparent'}`} />
            </motion.button>
          );
        })}
      </div>

      {/* 确认按钮 */}
      <AnimatePresence>
        {selected && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            onClick={handleConfirm}
            className="
              px-12 py-4 bg-green-600 text-black font-pixel font-bold text-xl
              hover:bg-green-500 transition-colors shadow-[0_0_20px_rgba(22,163,74,0.5)]
              clip-path-polygon
            "
            style={{ clipPath: 'polygon(10% 0, 100% 0, 100% 70%, 90% 100%, 0 100%, 0 30%)' }}
          >
            CONFIRM UPLOAD
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};