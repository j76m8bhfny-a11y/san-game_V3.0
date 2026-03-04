import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { RegionID } from '@/types/schema';
import { SuburbsItem } from './components/SuburbsItem';
import { useI18n } from '@/i18n';

interface Props {
  onClose: () => void;
}

export const SuburbsShop: React.FC<Props> = ({ onClose }) => {
  const { t } = useI18n();
  const { getRegionItems, buyItem, vitality } = useGameStore();
  
  const items = getRegionItems(RegionID.Suburbs);
  const gold = vitality.metrics.gold;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md" onClick={onClose}>
      
      {/* 1. 商店容器：明亮、整洁的超市视角 */}
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-6xl aspect-video bg-[#f8fafc] shadow-2xl overflow-hidden border-8 border-white rounded-xl flex flex-col"
        style={{
          backgroundImage: "url('/assets/shops/suburbs_shop_bg.jpg')", // 超市背景
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* --- 氛围层：冷柜雾气动画 --- */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-white/40 pointer-events-none animate-pulse-slow mix-blend-overlay" />
        
        {/* --- 顶部：品牌与欢迎语 --- */}
        <div className="h-28 bg-white/90 backdrop-blur-sm z-20 flex justify-between items-center px-10 shadow-sm border-b border-green-100">
          <div className="flex flex-col">
            <h1 className="text-4xl font-pixel font-black text-green-800 tracking-tight flex items-center gap-3">
              <span className="text-5xl">🌿</span> WHOLE LIFE
            </h1>
            <p className="text-sm text-green-600 font-pixel tracking-widest uppercase mt-1">
              ORGANIC • LOCAL • SUSTAINABLE
            </p>
          </div>

          {/* 电子会员卡风格的余额显示 */}
          <div className="bg-gradient-to-r from-green-700 to-green-600 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-4 transform hover:scale-105 transition-transform">
             <div className="text-right">
               <div className="text-[10px] font-medium opacity-80 uppercase">{t('shop.title')}</div>
               <div className="text-2xl font-bold font-pixel">${gold.toFixed(2)}</div>
             </div>
             <div className="h-8 w-8 bg-white/20 rounded-full flex items-center justify-center text-lg">💳</div>
          </div>
        </div>

        {/* --- 中部：精致木质货架区域 --- */}
        <div className="flex-1 overflow-y-auto px-16 py-10 custom-scrollbar z-10">
          
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 font-pixel">
              <span className="text-4xl mb-4">🍃</span>
              <span>{t('shop.insufficient')}</span>
            </div>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-10 gap-y-16">
              {items.map((item) => (
                <SuburbsItem 
                  key={item.id} 
                  item={item} 
                  canAfford={gold >= item.price}
                  onBuy={() => buyItem(item.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* --- 底部：收银台/传送带 --- */}
        <div className="h-24 bg-[#e2e8f0] border-t-4 border-[#cbd5e1] flex items-center justify-between px-10 relative z-20">
           {/* 模拟收银台传送带纹理 */}
           <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />

           <div className="relative z-10 flex items-center gap-4 text-gray-500">
             <div className="animate-spin-slow text-2xl">⚙️</div>
             <span className="font-mono text-xs uppercase tracking-widest">
               {t('shop.buy')}
             </span>
           </div>
           
           <button 
             onClick={onClose}
             className="relative z-10 px-8 py-3 bg-white hover:bg-red-50 text-gray-700 hover:text-red-600 border border-gray-300 hover:border-red-300 rounded-lg font-pixel font-bold transition-all shadow-sm"
           >
             {t('common.close').toUpperCase()}
           </button>
        </div>

      </div>
    </div>
  );
};
