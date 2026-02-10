import React, { useState } from 'react';
import { MedicalService } from '@/types/schema';
import { RustBeltMedicalItem } from './RustBeltMedicalItem';

interface Props {
  services: MedicalService[];
  gold: number;
  onBuy: (serviceId: string) => void;
  onClose: () => void;
}

export const RustBeltClinicInterior: React.FC<Props> = ({ services, gold, onBuy, onClose }) => {
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handlePurchase = (id: string) => {
    setProcessingId(id);
    // 模拟等待流程
    setTimeout(() => {
      onBuy(id);
      setProcessingId(null);
    }, 1500);
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden select-none bg-[#0f172a]">
      
      {/* 1. 背景：接待窗口 */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{ 
          backgroundImage: "url('/assets/medical/rust_clinic_interior.jpg')",
        }}
      >
        <div className="absolute inset-0 bg-blue-900/10" />
      </div>

      {/* 2. 容器：接待柜台界面 */}
      <div className="relative z-10 w-full max-w-4xl h-[85%] bg-[#1e293b] border-8 border-[#334155] shadow-2xl flex flex-col md:flex-row">
        
        {/* 左侧：服务菜单 (Menu Board) */}
        <div className="flex-1 bg-[#0f172a] border-r-4 border-[#334155] p-6 flex flex-col relative overflow-hidden">
          {/* 顶部灯箱 */}
          <div className="bg-blue-900/20 border border-blue-500/30 p-2 mb-4 text-center">
            <h2 className="text-blue-400 font-black font-sans uppercase tracking-widest text-lg">SERVICE MENU</h2>
          </div>

          {/* 列表区域 */}
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1 relative z-10">
            {services.map((service) => (
              <RustBeltMedicalItem 
                key={service.id}
                service={service}
                canAfford={gold >= service.baseCost}
                onBuy={() => handlePurchase(service.id)}
              />
            ))}
          </div>
          
          {/* 底部余额 */}
          <div className="mt-4 pt-4 border-t border-gray-700 flex justify-between items-center text-gray-400 font-mono text-xs">
             <span>PATIENT BALANCE:</span>
             <span className={gold < 50 ? 'text-red-500' : 'text-green-500'}>${gold.toFixed(2)}</span>
          </div>

          {/* 玻璃反光层 (UI上) */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none" />
        </div>

        {/* 右侧：交互窗口 (Reception Window) */}
        <div className="w-full md:w-1/3 bg-[#334155] relative flex flex-col items-center justify-end p-6">
          {/* 玻璃后面的场景 (模糊) */}
          <div className="absolute top-4 left-4 right-4 bottom-32 bg-[#0f172a] inset-shadow border-4 border-[#1e293b] overflow-hidden">
             <div className="absolute inset-0 bg-[url('/assets/medical/rust_receptionist_blur.jpg')] bg-cover opacity-50 blur-sm" />
             
             {/* 状态显示屏 */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center w-full">
               {processingId ? (
                 <div className="animate-pulse">
                   <div className="text-red-500 font-mono text-xl font-bold">PROCESSING</div>
                   <div className="text-red-500/70 text-xs">PLEASE WAIT...</div>
                 </div>
               ) : (
                 <div className="text-green-500/50 font-mono text-sm">NEXT PATIENT</div>
               )}
             </div>
          </div>

          {/* 交互槽 (Tray) */}
          <div className="w-full h-24 bg-[#1e293b] border-t-4 border-[#475569] mt-auto rounded-t-lg shadow-inner relative flex items-center justify-center">
            <div className="text-gray-500 font-mono text-[10px] uppercase tracking-widest text-center">
              INSERT CARD OR CASH<br/>INTO TRAY
            </div>
            
            {/* 交易动画：卡片/现金 */}
            {processingId && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-20 bg-green-800/20 animate-slide-in-up flex items-center justify-center border border-green-500/50">
                 <span className="text-green-400 text-xs font-bold">PAYMENT ACCEPTED</span>
              </div>
            )}
          </div>

          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white"
          >
            [X]
          </button>
        </div>

      </div>
    </div>
  );
};