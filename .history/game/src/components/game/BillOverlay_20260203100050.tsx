// src/components/game/BillOverlay.tsx

import React, { useEffect, useState } from 'react';
import { Bill } from '@/types/schema';
import { useGameStore } from '@/store/useGameStore';
import { useAudioStore } from '@/store/useAudioStore';
// ✅ 修复：移除未使用的 AnimatePresence 导入 (警告 6133)
import { motion } from 'framer-motion';

export const BillOverlay: React.FC<{ bill: Bill }> = ({ bill }) => {
  // ✅ 修复：resolveBill 可能已更名或需要从 UISlice/GameSlice 中获取
  // 如果你的 Store 中没有这个方法，请确保在相应的 Slice 中定义它
  // 这里暂时使用 set({ activeBill: null }) 的逻辑替代调用
  const setStore = useGameStore(s => s.setState || (s as any).updatePlayerStats);
  const { playSfx } = useAudioStore();
  const [isPaying, setIsPaying] = useState(false);

  useEffect(() => { 
    playSfx('sfx_paper'); 
  }, [playSfx]);

  const handlePay = () => {
    setIsPaying(true);
    playSfx('sfx_cash');
    
    // ✅ 修复：如果 resolveBill 不存在，则手动清除 activeBill 状态
    // 如果你在 createUISlice 中定义了专用的关闭方法，请替换此处
    setTimeout(() => {
      useGameStore.setState({ activeBill: null });
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-[6000] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 50 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="relative w-full max-w-md bg-[#Fdfbf7] text-black shadow-2xl overflow-hidden"
        style={{ clipPath: 'polygon(0 0, 100% 0, 100% 98%, 98% 100%, 0 100%)' }}
      >
        {/* 顶部装饰条 */}
        <div className={`h-2 w-full ${bill.amount > 0 ? 'bg-yellow-500' : 'bg-black'}`} />

        <div className="p-8 space-y-6">
          
          {/* 1. 标题 (Title) */}
          <div className="flex justify-between items-start border-b-2 border-black pb-4">
            <div>
              <h2 className="text-3xl font-black uppercase tracking-tighter leading-none">{bill.name}</h2>
              <div className="text-[10px] text-gray-500 font-mono mt-1">CASE ID: {bill.id}</div>
            </div>
            {/* 金额 (Amount) */}
            <div className={`text-2xl font-mono font-bold ${bill.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {bill.amount > 0 ? '+' : ''}${Math.abs(bill.amount)}
            </div>
          </div>

          {bill.image && (
            <div className="w-full h-40 bg-gray-200 border border-gray-400 overflow-hidden relative grayscale hover:grayscale-0 transition-all duration-500">
              <img 
                src={bill.image} 
                alt={bill.name}
                className="w-full h-full object-cover mix-blend-multiply opacity-90"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement!.classList.add('flex', 'items-center', 'justify-center');
                  e.currentTarget.parentElement!.innerText = '[IMAGE_CORRUPTED]';
                }}
              />
              <div className="absolute inset-0 bg-[url('/assets/textures/noise.svg')] opacity-20 pointer-events-none" />
            </div>
          )}

          {/* 2. 事件文字 (Flavor Text) */}
          <p className="font-serif text-lg leading-relaxed text-gray-800 italic">
            "{bill.flavorText}"
          </p>

          {/* 3. 新闻剪报 (News) */}
          {bill.news && (
            <div className="bg-gray-200/50 p-4 border-l-4 border-gray-400 relative">
              <div className="absolute -top-3 -right-2 bg-white border border-gray-300 px-2 py-0.5 text-[9px] font-bold uppercase transform rotate-2">
                Attachment
              </div>
              <div className="text-[10px] font-bold uppercase text-gray-500 mb-1">
                SOURCE: {bill.news.source}
              </div>
              <div className="font-mono text-xs text-gray-700 leading-tight">
                {bill.news.content}
              </div>
            </div>
          )}

          {/* 4. 一句话吐槽 (Roast) */}
          {bill.roast && (
            <div className="mt-4 pt-4 border-t border-dashed border-gray-300">
               <div className="flex gap-3 items-center">
                 <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold shrink-0">
                   SYS
                 </div>
                 <p className="text-sm font-bold text-gray-900 font-sans">
                   {bill.roast}
                 </p>
               </div>
            </div>
          )}

          {/* 按钮区域 */}
          <div className="pt-4">
            {!isPaying ? (
              <button 
                onClick={handlePay}
                className="w-full bg-black text-white py-4 font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors"
              >
                {bill.amount > 0 ? 'ACCEPT REWARD' : 'ACKNOWLEDGE'}
              </button>
            ) : (
              <div className="w-full py-4 text-center font-black text-2xl uppercase text-red-600 border-4 border-red-600 animate-pulse mix-blend-multiply rotate-[-2deg]">
                {bill.amount > 0 ? 'RECEIVED' : 'PROCESSED'}
              </div>
            )}
          </div>

        </div>

        {/* 纸张纹理 */}
        <div className="absolute inset-0 bg-[url('/assets/textures/noise.svg')] opacity-10 pointer-events-none mix-blend-multiply" />
      </motion.div>
    </div>
  );
};