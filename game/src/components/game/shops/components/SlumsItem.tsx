import React, { useMemo, useState } from 'react';
import { Item } from '@/types/schema';
import { useI18n } from '@/i18n';

interface Props {
  item: Item;
  canAfford: boolean;
  onBuy: () => void;
}

export const SlumsItem: React.FC<Props> = ({ item, canAfford, onBuy }) => {
  const { t } = useI18n();
  const [isHovered, setIsHovered] = useState(false);

  // 1. 生成随机视觉参数 (仅在组件挂载时计算一次)
  // 模拟物品是随意扔在车里的
  const style = useMemo(() => ({
    rotation: Math.random() * 20 - 10, // -10deg 到 10deg
    marginTop: Math.random() * 20,     // 随机上下错位
    marginLeft: Math.random() * 20,    // 随机左右错位
  }), []);

  // 2. 简单的图标映射 (实际项目中应使用 item.iconPath)
  const getIcon = (tags: string[]) => {
    if (tags.includes('FOOD')) return '🥫';
    if (tags.includes('WEAPON')) return '🔪';
    if (tags.includes('DRUG')) return '💊';
    return '📦';
  };

  return (
    <div 
      className="relative group cursor-pointer"
      style={{
        transform: `rotate(${style.rotation}deg) translate(${style.marginLeft}px, ${style.marginTop}px)`,
        transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)' // 弹性动画
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={canAfford ? onBuy : undefined}
    >
      {/* 物品本体容器 */}
      <div className={`
        relative w-32 h-32 mx-auto transition-all duration-300
        ${isHovered ? 'scale-110 -translate-y-2 drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]' : 'drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]'}
        ${!canAfford ? 'grayscale opacity-60' : ''}
      `}>
        {/* 这里将来替换为真实的透明背景 PNG 图片 */}
        <div className="w-full h-full flex items-center justify-center text-6xl select-none">
          {getIcon(item.tags)}
        </div>
      </div>

      {/* 价格标签：模拟撕下来的纸板 (Price Tag) */}
      <div className={`
        absolute -bottom-4 -right-2 bg-[#d4c5a9] text-black font-marker px-2 py-1 
        shadow-md border border-[#8b7e66] transform -rotate-6
        group-hover:rotate-0 transition-transform z-10
      `}>
        <span className="font-bold text-lg">${item.price}</span>
      </div>

      {/* 详情浮窗 (Tooltip)：像是便利贴 */}
      <div className={`
        absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 
        bg-[#fff9c4] text-black p-3 shadow-2xl rotate-1
        transition-all duration-200 pointer-events-none z-50
        ${isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-95 translate-y-2'}
      `}>
        {/* 胶带效果 */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-12 h-6 bg-white/40 rotate-2 backdrop-blur-[1px]" />
        
        <h3 className="font-bold text-sm uppercase border-b border-black/10 pb-1 mb-1">{item.name}</h3>
        <p className="text-xs font-serif leading-tight text-gray-800 italic">"{item.flavorText}"</p>
        
        <div className="mt-2 flex gap-2 text-[10px] font-mono">
           {item.effects?.hp !== undefined && <span className={item.effects.hp > 0 ? 'text-green-700' : 'text-red-700'}>HP {item.effects.hp > 0 ? '+' : ''}{item.effects.hp}</span>}
           {item.effects?.insight !== undefined && <span className={item.effects.insight > 0 ? 'text-amber-700' : 'text-purple-700'}>灵视{item.effects.insight > 0 ? '+' : ''}{item.effects.insight}</span>}
        </div>

        {!canAfford && (
          <div className="mt-2 text-center text-red-600 font-black text-xs border border-red-600 px-1 transform -rotate-2">
            {t('shop.insufficient')}
          </div>
        )}
      </div>
    </div>
  );
};