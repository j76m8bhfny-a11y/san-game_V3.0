import React from 'react';
import { ActiveHousingState } from '@/types/schema';
import { useI18n } from '@/i18n';

interface Props {
  housing: ActiveHousingState;
  onRest: () => void;
  onPayBills: () => void;
  onMoveOut: () => void;
  onClose: () => void;
}

export const SuburbsInterior: React.FC<Props> = ({ housing, onRest, onPayBills, onMoveOut, onClose }) => {
  const { t } = useI18n();
  return (
    <div className="relative w-full h-full flex flex-col p-6 overflow-hidden select-none">
      
      {/* 1. 场景：样板间客厅 */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{ 
          backgroundImage: "url('/assets/housing/suburbs_interior_bg.jpg')",
        }}
      >
        {/* 窗外阳光投射 */}
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-100/20 to-transparent mix-blend-overlay pointer-events-none" />
      </div>

      {/* 2. 左上角：房屋信息 (像是一个相框) */}
      <div className="absolute top-8 left-8 z-10 bg-white p-4 shadow-xl border-8 border-[#d4a373] transform -rotate-1 max-w-xs">
        <h2 className="text-gray-800 font-serif font-bold text-lg border-b border-gray-200 pb-2 mb-2">
          Home Sweet Home
        </h2>
        <div className="space-y-1 text-xs font-sans text-gray-600">
          <div className="flex justify-between">
            <span>Status:</span>
            <span className="font-bold text-green-600">{housing.type === 'OWN' ? 'MORTGAGED' : 'LEASED'}</span>
          </div>
          <div className="flex justify-between">
            <span>Comfort:</span>
            <span className="font-bold text-[#d4a373]">HIGH</span>
          </div>
          <div className="flex justify-between">
            <span>Weekly Cost:</span>
            <span className="font-bold text-red-500">-${housing.weeklyCosts.reduce((a, b) => a + b.baseAmount, 0) || 0}</span>
          </div>
        </div>
      </div>

      {/* 3. 交互物体：桌上的账单堆 (Pay Bills) */}
      <div className="absolute bottom-20 left-20 z-10 group cursor-pointer" onClick={onPayBills}>
        <div className="relative w-32 h-24 transition-transform group-hover:scale-110 group-hover:-translate-y-2">
          <img src="/assets/housing/ui_bill_stack.png" className="w-full h-full object-contain drop-shadow-xl" />
          {/* 提示气泡 */}
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white px-3 py-1 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            <span className="text-xs font-bold text-gray-700">{t('housing.weeklyCost')}</span>
          </div>
        </div>
      </div>

      {/* 4. 底部交互栏 */}
      <div className="relative z-10 mt-auto flex justify-end items-end gap-8 pb-4 pr-8">
        
        {/* 卖房/退租按钮 */}
        <button 
          onClick={onMoveOut}
          className="group flex flex-col items-center opacity-60 hover:opacity-100 transition-opacity"
        >
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md border border-gray-200 group-hover:border-red-400">
            🏷️
          </div>
          <span className="mt-1 bg-white/90 text-gray-500 text-[10px] px-2 py-0.5 rounded shadow-sm font-bold uppercase">
            {t('housing.moveOut')}
          </span>
        </button>

        {/* 休息按钮：舒适的沙发 */}
        <button 
          onClick={onRest}
          className="group relative w-56 transition-transform hover:scale-105"
        >
          <img src="/assets/housing/ui_sofa.png" className="w-full object-contain drop-shadow-2xl" />
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-[#1e3a8a] text-white px-4 py-1 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
             <span className="font-bold text-sm uppercase tracking-wider">
               {t('housing.regen')}
             </span>
          </div>
        </button>

        {/* 离开按钮 */}
        <button 
          onClick={onClose}
          className="group flex flex-col items-center opacity-60 hover:opacity-100 transition-opacity"
        >
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md border border-gray-200 group-hover:border-blue-400">
            🚪
          </div>
          <span className="mt-1 bg-white/90 text-gray-500 text-[10px] px-2 py-0.5 rounded shadow-sm font-bold uppercase">{t('common.close')}</span>
        </button>
      </div>

    </div>
  );
};