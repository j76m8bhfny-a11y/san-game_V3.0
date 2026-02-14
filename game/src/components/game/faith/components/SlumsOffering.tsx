import React from 'react';
import { Item } from '@/types/schema';
import { useI18n } from '@/i18n';

interface Props {
  item: Item;
  count: number;
  isSelected: boolean;
  onClick: () => void;
}

export const SlumsOffering: React.FC<Props> = ({ item, count, isSelected, onClick }) => {
  const { t } = useI18n();
  // 简单的图标映射
  const getIcon = (tags: string[]) => {
    if (tags.includes('FOOD')) return '🥩'; 
    if (tags.includes('DRUG')) return '🚬'; 
    if (tags.includes('ALCOHOL')) return '🍾';
    return '📦';
  };

  return (
    <div 
      onClick={onClick}
      className={`
        relative w-20 h-20 flex items-center justify-center cursor-pointer transition-all duration-200
        ${isSelected ? 'scale-110 -translate-y-2' : 'hover:scale-105'}
      `}
    >
      {/* 选中光圈 */}
      {isSelected && (
        <div className="absolute inset-0 bg-orange-500/30 rounded-full blur-md animate-pulse" />
      )}

      {/* 物品本体 */}
      <div className={`
        text-4xl filter drop-shadow-md
        ${isSelected ? 'brightness-125' : 'brightness-75 grayscale-[0.5]'}
      `}>
        {getIcon(item.tags)}
      </div>

      {/* 数量标签 */}
      <div className="absolute bottom-0 right-0 bg-black/80 text-gray-300 text-[10px] font-mono px-1 border border-gray-600">
        {t('common.count', { count })}
      </div>

      {/* 选中时的箭头 */}
      {isSelected && (
        <div className="absolute -top-4 text-orange-500 text-xs font-bold animate-bounce">
          ▼
        </div>
      )}
    </div>
  );
};
