// src/components/game/ShopModal.tsx
import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { Item } from '@/types/schema';

export const ShopModal: React.FC = () => {
  const items = useGameStore(s => s.shopItems);
  const gold = useGameStore(s => s.gold);
  const buyItem = useGameStore(s => s.buyItem);
  const close = () => useGameStore.getState().setShopOpen(false);

  // ✅ [逻辑修复] 条件解析器
  const isItemUnlocked = (item: Item, currentGold: number): boolean => {
    // 1. 如果没有条件，默认解锁
    if (!item.unlockCondition) return true;

    // 2. 解析 "Gold < -2000" 这种简单的条件字符串
    // 注意：这里是一个简单的硬编码解析，如果条件复杂建议用 eval 或专门的 parser
    if (item.unlockCondition.includes('Gold')) {
        const parts = item.unlockCondition.split(' '); // ["Gold", "<", "-2000"]
        if (parts.length === 3) {
            const operator = parts[1];
            const value = parseInt(parts[2], 10);
            
            if (!isNaN(value)) {
                if (operator === '<') return currentGold < value;
                if (operator === '>') return currentGold > value;
                if (operator === '<=') return currentGold <= value;
                if (operator === '>=') return currentGold >= value;
            }
        }
    }
    
    return false; // 无法解析或条件不满足
  };

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center p-4 md:p-12 bg-black/80 backdrop-grayscale">
      {/* ... (外框代码保持不变) ... */}
      
      <div className="flex-1 bg-white overflow-y-auto custom-scrollbar p-4">
          
          {/* ... (Header 保持不变) ... */}

          {/* 商品网格 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {items.map((item) => {
              // ✅ 拦截：如果未解锁，直接不渲染 (Hidden)
              // 这样 "D05" 只有在负债累累时才会突然出现，给玩家惊喜/惊吓
              if (!isItemUnlocked(item, gold)) return null;

              return (
                <div key={item.id} className="border-2 border-blue-600 p-2 text-center bg-[#ffffcc] hover:bg-[#ffffaa] transition-colors relative group">
                  {/* 图片框 */}
                  <div className="w-full h-24 border border-black mb-2 bg-white flex items-center justify-center overflow-hidden">
                     <img 
                       src={`/assets/items/${item.id}.png`} 
                       className="object-cover h-full w-full grayscale contrast-125 group-hover:grayscale-0 transition-all" 
                       alt={item.name} 
                       onError={(e) => (e.currentTarget.style.display = 'none')} 
                     />
                  </div>
                  
                  <div className="font-bold text-blue-700 underline cursor-pointer text-sm mb-1">{item.name}</div>
                  
                  {/* 特殊价格显示 */}
                  <div className={`font-bold text-lg font-serif ${item.price <= 0 ? 'text-red-600 animate-pulse' : 'text-green-700'}`}>
                    {item.price === 0 ? 'FREE' : item.price < 0 ? `GET $${Math.abs(item.price)}` : `$${item.price}`}
                  </div>
                  
                  <div className="text-[10px] text-black mt-1 leading-tight h-8 overflow-hidden">{item.flavorText}</div>
                  
                  <button 
                    onClick={() => buyItem(item.id)}
                    // 如果是普通商品且钱不够 -> Disable
                    // 如果是特殊商品 (Price <= 0) -> Always Enable
                    disabled={item.price > 0 && gold < item.price}
                    className={`mt-3 w-full border-2 border-white border-b-black border-r-black px-2 py-1 text-xs active:border-t-black active:border-l-black select-none
                      ${item.price <= 0 ? 'bg-red-100 hover:bg-red-200 text-red-900 font-bold' : 'bg-[#e0e0e0] active:bg-[#cccccc] disabled:opacity-50 disabled:cursor-not-allowed'}
                    `}
                  >
                    {item.price <= 0 ? 'ACCEPT DEAL' : 'Add to Cart'}
                  </button>
                </div>
              );
            })}
          </div>
          
          {/* ... (Footer 保持不变) ... */}
      </div>
    </div>
  );
};