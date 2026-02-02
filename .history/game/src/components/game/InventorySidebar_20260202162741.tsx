import React, { useState, useMemo } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { Item, ItemType } from '@/types/schema';
import { useAudioStore } from '@/store/useAudioStore'; // 假设你有这个
import { Package, Zap, Key , Info } from 'lucide-react'; // 引入图标

export const InventorySidebar: React.FC = () => {
  const { 
    isInventoryOpen, 
    setInventoryOpen, 
    inventory, 
    gameDataCache,
    useItem // ✅ 假设这是上一轮我们在 createShopSlice 中实现的 action
  } = useGameStore();
  
  const { playSfx } = useAudioStore();
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<ItemType | 'ALL'>('ALL');

  // 1. 解析库存数据
  const inventoryItems = useMemo(() => {
    if (!gameDataCache?.items) return [];
    // 将 ID 列表转换为 Item 对象列表
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

  // 3. 处理使用
  const handleUse = () => {
    if (!selectedItem) return;
    useItem(selectedItem.id);
    // 如果是消耗品，使用后可能消失，重置选中状态
    if (selectedItem.type === ItemType.CONSUMABLE) {
      setSelectedItemId(null);
    }
  };

  const panelClass = `
    fixed top-0 right-0 bottom-0 z-50 w-full md:w-96 bg-[#0a0a0a] border-l border-white/10 
    transform transition-transform duration-300 ease-out flex flex-col font-sans
    ${isInventoryOpen ? 'translate-x-0 shadow-[-20px_0_50px_rgba(0,0,0,0.8)]' : 'translate-x-full'}
  `;

  return (
    <div className={panelClass} onClick={e => e.stopPropagation()}>
      
      {/* Header */}
      <div className="p-6 border-b border-white/10 bg-[#111] flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-200 tracking-wider flex items-center gap-2">
          <Package className="w-5 h-5 text-amber-500" />
          INVENTORY
          <span className="text-xs text-gray-500 font-normal ml-2">({inventory.length})</span>
        </h2>
        <button onClick={() => setInventoryOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-gray-500 hover:text-white transition-colors">
          ✕
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex p-2 gap-1 border-b border-white/10 bg-[#0f0f0f] overflow-x-auto no-scrollbar">
        <FilterTab label="全部" active={filterType === 'ALL'} onClick={() => setFilterType('ALL')} />
        <FilterTab label="消耗" icon={<Zap size={12}/>} active={filterType === ItemType.CONSUMABLE} onClick={() => setFilterType(ItemType.CONSUMABLE)} />
        <FilterTab label="被动" icon={<Info size={12}/>} active={filterType === ItemType.PASSIVE} onClick={() => setFilterType(ItemType.PASSIVE)} />
        <FilterTab label="剧情" icon={<Key size={12}/>} active={filterType === ItemType.KEY} onClick={() => setFilterType(ItemType.KEY)} />
      </div>

      {/* Grid Content */}
      <div className="flex-1 overflow-y-auto p-4 bg-[#050505]">
        {filteredItems.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-600 space-y-2 opacity-50">
            <Package size={48} strokeWidth={1} />
            <p className="text-sm font-mono">NO ITEMS FOUND</p>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-3">
            {filteredItems.map((item, idx) => (
              <button
                key={`${item.id}-${idx}`} // 使用 idx 防止重复 ID key 冲突
                onClick={() => { playSfx('sfx_click'); setSelectedItemId(item.id); }}
                className={`
                  aspect-square rounded-xl border flex items-center justify-center relative transition-all group overflow-hidden
                  ${selectedItemId === item.id 
                    ? 'bg-white/10 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]' 
                    : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20'}
                `}
              >
                {/* 简单的图标占位，实际可以用图片 */}
                <span className="text-2xl filter drop-shadow-lg">
                  {getItemIcon(item)}
                </span>
                
                {/* 类型角标 */}
                <div className={`absolute bottom-1 right-1 w-2 h-2 rounded-full ${getTypeColor(item.type)}`}></div>
              </button>
            ))}
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
                    {selectedItem.type}
                  </span>
                  {selectedItem.tags.map(tag => (
                    <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-gray-500 border border-white/5">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-gray-500 block">EST. VALUE</span>
                <span className="text-amber-500 font-mono">${selectedItem.price}</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto mb-4 pr-2 custom-scrollbar">
              <p className="text-sm text-gray-400 font-serif italic leading-relaxed">
                “{selectedItem.flavorText}”
              </p>
              
              {/* 效果展示 */}
              <div className="mt-4 space-y-1 text-xs font-mono">
                 {selectedItem.effects?.hp !== undefined && <div className={selectedItem.effects.hp > 0 ? 'text-green-500' : 'text-red-500'}>HP: {selectedItem.effects.hp > 0 ? '+' : ''}{selectedItem.effects.hp}</div>}
                 {selectedItem.effects?.san !== undefined && <div className={selectedItem.effects.san > 0 ? 'text-blue-500' : 'text-purple-500'}>SAN: {selectedItem.effects.san > 0 ? '+' : ''}{selectedItem.effects.san}</div>}
                 {selectedItem.type === ItemType.KEY && <div className="text-amber-300 flex items-center gap-1"><Key size={10}/> 可解锁特殊事件选项</div>}
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
              {selectedItem.type === ItemType.CONSUMABLE ? 'USE ITEM' : 'PASSIVE / KEY'}
            </button>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-600 opacity-50">
            <Info size={32} className="mb-2"/>
            <p className="text-xs tracking-widest">SELECT AN ITEM TO INSPECT</p>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Helpers ---

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
  // 这里可以根据 item.id 或 item.tags 返回不同的 emoji 或图片组件
  if (item.tags.includes('FOOD')) return '🥫';
  if (item.tags.includes('MEDICAL')) return '💉';
  if (item.tags.includes('WEAPON')) return '🔪';
  if (item.tags.includes('BOOK')) return '📘';
  if (item.tags.includes('VEHICLE')) return '🚗';
  if (item.type === ItemType.KEY) return '🗝️';
  return '📦';
};