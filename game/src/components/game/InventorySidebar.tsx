import React, { useState, useMemo } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { Item, ItemType } from '@/types/schema';
import { useAudioStore } from '@/store/useAudioStore'; 
import { useI18n } from '@/i18n';
import { Package, Zap, Key, Info, AlertTriangle } from 'lucide-react'; // ✅ 新增 AlertTriangle 图标
import shopRules from '@/assets/data/rules/shop_rules.json'; // ✅ 引入 Source of Truth

export const InventorySidebar: React.FC = () => {
  const { t } = useI18n();
  const { 
    isInventoryOpen, 
    setInventoryOpen, 
    inventory, 
    gameDataCache,
    vitality, // ✅ 获取 vitality 用于计算耐药性
    useItem 
  } = useGameStore();
  
  const { playSfx } = useAudioStore();
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<ItemType | 'ALL'>('ALL');

  // 1. 解析库存数据
  const inventoryItems = useMemo(() => {
    if (!gameDataCache?.items) return [];
    return inventory.map((id: string) => gameDataCache.items.find((i: Item) => i.id === id)).filter(Boolean) as Item[];
  }, [inventory, gameDataCache]);

  // 2. 筛选逻辑
  const filteredItems = useMemo(() => {
    if (filterType === 'ALL') return inventoryItems;
    return inventoryItems.filter(item => item.type === filterType);
  }, [inventoryItems, filterType]);

  const selectedItem = selectedItemId 
    ? inventoryItems.find(i => i.id === selectedItemId) 
    : null;

  // ✅ 辅助函数：UI层预计算实际效果（与 createShopSlice 逻辑保持一致）
  const getPredictedEffect = (item: Item, baseValue: number) => {
    // 只有开启了耐药性且物品是药物时才计算
    if (!shopRules.drugResistance.enable) return baseValue;
    if (!item.tags.includes('DRUG')) return baseValue; 
    
    const { divisor, minEffectiveness } = shopRules.drugResistance;
    const currentResistance = vitality.metrics.resistance || 0;
    
    // 复用核心公式：Max(min, 1 - (R / divisor))
    const effectiveness = Math.max(minEffectiveness, 1 - (currentResistance / divisor));
    return Math.floor(baseValue * effectiveness);
  };

  // 3. 处理使用
  const handleUse = () => {
    if (!selectedItem) return;
    useItem(selectedItem.id);
    if (selectedItem.type === ItemType.CONSUMABLE) {
      setSelectedItemId(null);
    }
  };

  const panelClass = `
    fixed top-0 right-0 bottom-0 z-50 w-full md:w-96 bg-[#0a0a0a] border-l border-white/10 
    transform transition-transform duration-300 ease-out flex flex-col font-pixel
    ${isInventoryOpen ? 'translate-x-0 shadow-[-20px_0_50px_rgba(0,0,0,0.8)]' : 'translate-x-full'}
  `;

  // 检查是否已满
  const isFull = inventory.length >= shopRules.inventory.maxSize;

  return (
    <div className={panelClass} onClick={e => e.stopPropagation()}>
      
      {/* Header */}
      <div className="p-6 border-b border-white/10 bg-[#111] flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-200 tracking-wider flex items-center gap-2">
          <Package className="w-5 h-5 text-amber-500" />
          {t('inventory.title')}
          {/* ✅ 修复：显示上限，并在满载时变红 */}
          <span className={`text-xs font-normal ml-2 ${isFull ? 'text-red-500' : 'text-gray-500'}`}>
            ({inventory.length} / {shopRules.inventory.maxSize})
          </span>
        </h2>
        <button onClick={() => setInventoryOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-gray-500 hover:text-white transition-colors">
          ✕
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex p-2 gap-1 border-b border-white/10 bg-[#0f0f0f] overflow-x-auto no-scrollbar">
        <FilterTab label={t('inventory.filter.all')} active={filterType === 'ALL'} onClick={() => setFilterType('ALL')} />
        <FilterTab label={t('inventory.filter.consumable')} icon={<Zap size={12}/>} active={filterType === ItemType.CONSUMABLE} onClick={() => setFilterType(ItemType.CONSUMABLE)} />
        <FilterTab label={t('inventory.filter.passive')} icon={<Info size={12}/>} active={filterType === ItemType.PASSIVE} onClick={() => setFilterType(ItemType.PASSIVE)} />
        <FilterTab label={t('inventory.filter.key')} icon={<Key size={12}/>} active={filterType === ItemType.KEY} onClick={() => setFilterType(ItemType.KEY)} />
      </div>

      {/* Grid Content */}
      <div className="flex-1 overflow-y-auto p-4 bg-[#050505]">
        {filteredItems.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-600 space-y-2 opacity-50">
            <Package size={48} strokeWidth={1} />
            <p className="text-sm font-mono">{t('inventory.empty')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-3">
            {filteredItems.map((item, idx) => (
              <button
                key={`${item.id}-${idx}`}
                onClick={() => { playSfx('sfx_click'); setSelectedItemId(item.id); }}
                className={`
                  aspect-square rounded-xl border flex items-center justify-center relative transition-all group overflow-hidden
                  ${selectedItemId === item.id 
                    ? 'bg-white/10 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]' 
                    : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20'}
                `}
              >
                <span className="text-2xl filter drop-shadow-lg">
                  {getItemIcon(item)}
                </span>
                <div className={`absolute bottom-1 right-1 w-2 h-2 rounded-full ${getTypeColor(item.type)}`}></div>
              </button>
            ))}
            
            {/* 可选：显示空的占位格子以暗示总容量，提升 UI 质感 */}
            {/* Array.from({ length: Math.max(0, shopRules.inventory.maxSize - inventory.length) }).map((_, i) => (
               <div key={i} className="aspect-square rounded-xl border border-white/5 bg-black/20" />
            )) */}
          </div>
        )}
      </div>

      {/* Detail Panel (Bottom) */}
      <div className="h-1/3 min-h-[200px] border-t border-white/10 bg-[#111] p-6 flex flex-col relative">
        {selectedItem ? (
          <>
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-lg font-bold text-white">{selectedItem.name}</h3>
                <div className="flex gap-2 mt-1">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border ${getTypeBadgeStyle(selectedItem.type)}`}>
                    {selectedItem.type === ItemType.CONSUMABLE ? t('inventory.itemType.consumable') : selectedItem.type === ItemType.PASSIVE ? t('inventory.itemType.passive') : selectedItem.type === ItemType.KEY ? t('inventory.itemType.key') : selectedItem.type}
                  </span>
                  {selectedItem.tags.map(tag => (
                    <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-gray-500 border border-white/5">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-gray-500 block">{t('inventory.details.estValue')}</span>
                <span className="text-amber-500 font-mono">${selectedItem.price}</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto mb-4 pr-2 custom-scrollbar">
              <p className="text-sm text-gray-400 font-pixel italic leading-relaxed">
                “{selectedItem.flavorText}”
              </p>
              
              {/* ✅ 修复：效果展示逻辑 */}
              <div className="mt-4 space-y-1 text-xs font-mono">
                 {selectedItem.effects?.hp !== undefined && (() => {
                   const raw = selectedItem.effects.hp;
                   const predicted = getPredictedEffect(selectedItem, raw);
                   const isReduced = predicted < raw;
                   
                   return (
                     <div className={`flex items-center gap-2 ${predicted > 0 ? 'text-green-500' : 'text-red-500'}`}>
                       <span>HP: {predicted > 0 ? '+' : ''}{predicted}</span>
                       {/* 如果产生耐药性衰减，显示原值和警告图标 */}
                       {isReduced && (
                         <>
                           <span className="text-gray-600 line-through text-[10px]">
                             {raw}
                           </span>
                           <div className="group relative">
                              <AlertTriangle size={12} className="text-amber-600" />
                              {/* 简单的 Tooltip */}
                              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-black text-white text-[10px] rounded hidden group-hover:block whitespace-nowrap border border-white/20">
                                {t('inventory.resistance.warning')}
                              </span>
                           </div>
                         </>
                       )}
                     </div>
                   );
                 })()}
                 
                 {selectedItem.effects?.insight !== undefined && <div className={selectedItem.effects.insight > 0 ? 'text-amber-500' : 'text-purple-500'}>灵视: {selectedItem.effects.insight > 0 ? '+' : ''}{selectedItem.effects.insight}</div>}
                 {selectedItem.type === ItemType.KEY && <div className="text-amber-300 flex items-center gap-1"><Key size={10}/> {t('inventory.details.unlockHint')}</div>}
              </div>
            </div>

            <button
              onClick={handleUse}
              disabled={selectedItem.type !== ItemType.CONSUMABLE}
              className={`
                w-full py-3 rounded-lg font-bold text-sm tracking-widest transition-all
                ${selectedItem.type === ItemType.CONSUMABLE
                  ? 'bg-white text-black hover:bg-gray-200 active:scale-95'
                  : 'bg-white/5 text-white/30 cursor-not-allowed border border-white/5'}
              `}
            >
              {selectedItem.type === ItemType.CONSUMABLE ? t('inventory.actions.use') : t('inventory.actions.cannotUse')}
            </button>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-600 opacity-50">
            <Info size={32} className="mb-2"/>
            <p className="text-xs tracking-widest">{t('inventory.actions.selectToView')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Helpers ---
// (保持原样，如果需要也可以后续将 getTypeColor/Icon 迁移到配置中)
const FilterTab = ({ label, icon, active, onClick }: any) => (
  <button 
    onClick={onClick}
    className={`
      flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap
      ${active ? 'bg-white text-black' : 'bg-transparent text-gray-500 hover:text-white hover:bg-white/5'}
    `}
  >
    {icon} {label}
  </button>
);

const getTypeColor = (type: ItemType) => {
  switch (type) {
    case ItemType.CONSUMABLE: return 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.8)]';
    case ItemType.PASSIVE: return 'bg-blue-500';
    case ItemType.KEY: return 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]';
    case ItemType.ENDING: return 'bg-purple-500';
    default: return 'bg-gray-500';
  }
};

const getTypeBadgeStyle = (type: ItemType) => {
  switch (type) {
    case ItemType.CONSUMABLE: return 'border-green-500/30 text-green-500 bg-green-500/10';
    case ItemType.PASSIVE: return 'border-blue-500/30 text-blue-500 bg-blue-500/10';
    case ItemType.KEY: return 'border-amber-500/30 text-amber-500 bg-amber-500/10';
    default: return 'border-gray-500/30 text-gray-500';
  }
};

const getItemIcon = (item: Item) => {
  if (item.tags.includes('FOOD')) return '🥫';
  if (item.tags.includes('MEDICAL')) return '💉';
  if (item.tags.includes('WEAPON')) return '🔪';
  if (item.tags.includes('BOOK')) return '📘';
  if (item.tags.includes('VEHICLE')) return '🚗';
  if (item.type === ItemType.KEY) return '🗝️';
  return '📦';
};