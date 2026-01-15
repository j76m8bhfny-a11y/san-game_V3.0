import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { create } from 'zustand';

// --- 1. Store: 管理反馈队列 ---
type FeedbackItem = {
  id: string;
  text: string;
  type: 'damage' | 'heal' | 'san-loss' | 'san-gain' | 'money-loss' | 'money-gain';
  x: number;
  y: number;
};

interface FeedbackStore {
  items: FeedbackItem[];
  addFeedback: (text: string, type: FeedbackItem['type'], x?: number, y?: number) => void;
  removeFeedback: (id: string) => void;
}

export const useFeedbackStore = create<FeedbackStore>((set) => ({
  items: [],
  addFeedback: (text, type, x = 50, y = 50) => {
    const id = Math.random().toString(36).substring(7);
    // 随机微调位置，防止重叠
    const randomX = x + (Math.random() * 10 - 5); 
    const randomY = y + (Math.random() * 10 - 5);
    
    set((state) => ({
      items: [...state.items, { id, text, type, x: randomX, y: randomY }]
    }));

    // 1.5秒后自动消失
    setTimeout(() => {
      set((state) => ({ items: state.items.filter((i) => i.id !== id) }));
    }, 1500);
  },
  removeFeedback: (id) => set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
}));

// --- 2. Component: 渲染层 ---
export const FeedbackLayer: React.FC = () => {
  const items = useFeedbackStore((state) => state.items);

  const getColor = (type: FeedbackItem['type']) => {
    switch (type) {
      case 'damage': return 'text-red-600 font-creepster text-2xl'; // 掉血：恐怖红
      case 'heal': return 'text-green-500 font-bold text-xl';       // 回血：绿色
      case 'san-loss': return 'text-purple-700 font-mono font-bold';// 掉SAN：深紫
      case 'san-gain': return 'text-blue-400 font-bold';            // 回SAN：蓝色
      case 'money-loss': return 'text-red-500 font-mono';           // 扣钱
      case 'money-gain': return 'text-yellow-400 font-mono font-bold text-xl'; // 加钱
      default: return 'text-white';
    }
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      <AnimatePresence>
        {items.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: item.y + '%', x: item.x + '%', scale: 0.5 }}
            animate={{ opacity: 1, y: (item.y - 10) + '%', scale: 1.2 }} // 向上飘动
            exit={{ opacity: 0, y: (item.y - 20) + '%', scale: 0.8 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={`absolute transform -translate-x-1/2 -translate-y-1/2 drop-shadow-md ${getColor(item.type)}`}
          >
            {item.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

// --- 3. Helper: 快捷调用 Hook ---
export const useTriggerFeedback = () => {
  const add = useFeedbackStore(s => s.addFeedback);
  
  // 传入数值变化，自动判断类型
  const trigger = (diff: { hp?: number, san?: number, gold?: number }) => {
    if (diff.hp) add(diff.hp > 0 ? `HP +${diff.hp}` : `HP ${diff.hp}`, diff.hp > 0 ? 'heal' : 'damage', 50, 40);
    if (diff.san) add(diff.san > 0 ? `SAN +${diff.san}` : `SAN ${diff.san}`, diff.san > 0 ? 'san-gain' : 'san-loss', 50, 30);
    if (diff.gold) add(diff.gold > 0 ? `$ +${diff.gold}` : `$ ${diff.gold}`, diff.gold > 0 ? 'money-gain' : 'money-loss', 50, 50);
  };
  return trigger;
};