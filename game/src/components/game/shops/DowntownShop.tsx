import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { RegionID } from '@/types/schema';
import { DowntownItem } from './components/DowntownItem';
import { useI18n } from '@/i18n';

interface Props {
  onClose: () => void;
}

export const DowntownShop: React.FC<Props> = ({ onClose }) => {
  const { t } = useI18n();
  const { getRegionItems, buyItem, vitality } = useGameStore();
  
  const items = getRegionItems(RegionID.Downtown);
  const gold = vitality.metrics.gold;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-solid-dark" onClick={onClose}>
      
      {/* 1. 场景容器：私人会所 VIP 室 */}
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-7xl h-[90vh] bg-[#0a0a0a] shadow-[0_0_100px_rgba(212,175,55,0.2)] flex overflow-hidden border border-[#333]"
      >
        {/* 背景：深色大理石纹理 + 香槟金光晕 */}
        <div 
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: "url('/assets/shops/downtown_shop_bg.jpg')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        {/* 动态覆盖层：香槟气泡效果 (CSS 动画) */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(253,224,71,0.1),transparent_60%)] pointer-events-none" />
        
        {/* --- 左侧：尊贵的侧边栏 (Concierge) --- */}
        <div className="relative z-10 w-1/4 h-full bg-black/80 border-r border-white/10 flex flex-col p-10 backdrop-solid-dark">
          <div className="mb-12">
            <h1 className="text-5xl font-pixel text-[#d4af37] mb-2 tracking-widest">
              {t('shop.title')}
            </h1>
            <div className="h-0.5 w-12 bg-[#d4af37] mb-4" />
            <p className="text-gray-400 font-pixel text-xs tracking-[0.3em] uppercase">
              {t('shop.membersOnly')}
            </p>
          </div>

          {/* 会员卡片信息 */}
          <div className="mt-auto mb-12">
             <div className="text-[#888] text-[10px] uppercase tracking-widest mb-2">{t('common.price')}</div>
             <div className="text-3xl font-pixel text-white mb-1">
               <span className="text-[#d4af37] text-lg mr-1">$</span>
               {gold.toLocaleString('en-US', { minimumFractionDigits: 2 })}
             </div>
             <div className="text-[#444] text-xs font-mono">ID: 000-VIP-888</div>
          </div>

          <button 
            onClick={onClose}
            className="text-left text-gray-500 hover:text-white transition-colors text-xs font-pixel tracking-widest uppercase flex items-center gap-2 group"
          >
            <span className="w-8 h-[1px] bg-gray-600 group-hover:bg-white transition-colors" />
            {t('common.close')}
          </button>
        </div>

        {/* --- 右侧：藏品展示区 (Catalog) --- */}
        <div className="flex-1 relative z-10 overflow-y-auto custom-scrollbar p-16">
          <div className="max-w-4xl mx-auto">
            
            {/* 顶部标语 */}
            <div className="text-center mb-16">
              <h2 className="text-white font-pixel text-2xl italic opacity-80">
                "Power is the ultimate currency."
              </h2>
              <div className="text-[#d4af37] text-xs mt-2 uppercase tracking-[0.2em] font-light">
                Exclusive Acquisitions • Q1 2026
              </div>
            </div>

            {items.length === 0 ? (
              <div className="text-center py-20 border border-white/10">
                <p className="text-gray-500 font-pixel italic">{t('shop.empty')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {items.map((item) => (
                  <DowntownItem 
                    key={item.id} 
                    item={item} 
                    canAfford={gold >= item.price}
                    onBuy={() => buyItem(item.id)}
                  />
                ))}
              </div>
            )}
            
            {/* 底部装饰：免责声明 */}
            <div className="mt-20 text-center">
              <p className="text-[#333] text-[10px] font-pixel tracking-wider uppercase">
                All transactions are final and confidential. <br/>
                The Club is not responsible for any geopolitical consequences of your purchases.
              </p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};