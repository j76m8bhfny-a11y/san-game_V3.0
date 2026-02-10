import React, { useState } from 'react';
import { MedicalService } from '@/types/schema';
import { SuburbsMedicalItem } from './SuburbsMedicalItem';

interface Props {
  services: MedicalService[];
  gold: number;
  onBuy: (serviceId: string) => void;
  onClose: () => void;
}

export const SuburbsClinicInterior: React.FC<Props> = ({ services, gold, onBuy, onClose }) => {
  
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-4 select-none bg-gray-50">
      
      {/* 1. 背景：药房柜台 */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{ 
          backgroundImage: "url('/assets/medical/suburbs_clinic_interior.jpg')",
        }}
      >
        <div className="absolute inset-0 bg-white/30" />
      </div>

      {/* 2. 容器：整洁的商品陈列区 */}
      <div className="relative z-10 w-full max-w-5xl h-[85%] bg-white/90 backdrop-blur-md shadow-2xl rounded-2xl border border-white flex flex-col overflow-hidden">
        
        {/* 顶部：分类与广告 */}
        <div className="h-20 border-b border-gray-100 flex items-center justify-between px-8 bg-gradient-to-r from-red-50 to-white">
          <div>
            <h2 className="text-2xl font-black text-gray-800 tracking-tight">Pharmacy</h2>
            <div className="text-xs text-gray-500 font-medium">Pick up your prescription</div>
          </div>
          
          <div className="flex items-center gap-4">
             {/* 医保提示 */}
             <div className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
               <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
               <span className="text-[10px] text-blue-600 font-bold uppercase">Insurance Active</span>
             </div>
             
             {/* 余额 */}
             <div className="text-right">
               <div className="text-[10px] text-gray-400 uppercase">Copay Balance</div>
               <div className="text-xl font-bold text-gray-800">${gold.toFixed(2)}</div>
             </div>
          </div>
        </div>

        {/* 中间：货架 Grid */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {services.map((service) => (
              <SuburbsMedicalItem 
                key={service.id}
                service={service}
                canAfford={gold >= service.baseCost}
                onBuy={() => onBuy(service.id)}
              />
            ))}
          </div>
        </div>

        {/* 底部：收银台提示 */}
        <div className="h-16 bg-gray-50 border-t border-gray-200 flex items-center justify-between px-8">
           <div className="flex items-center gap-3 text-gray-400">
             <div className="text-2xl">🛒</div>
             <span className="text-xs font-medium">Please scan items at the counter.</span>
           </div>
           
           <button 
             onClick={onClose}
             className="px-6 py-2 bg-white border border-gray-300 rounded-lg text-gray-600 font-bold text-sm hover:bg-gray-100 transition-colors shadow-sm"
           >
             Exit Store
           </button>
        </div>
      </div>

    </div>
  );
};