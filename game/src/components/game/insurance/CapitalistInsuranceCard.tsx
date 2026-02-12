import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { useAudioStore } from '@/store/useAudioStore';
import insuranceData from '@/assets/data/insurance.json';

export const CapitalistInsuranceCard: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { signInsurance, cancelInsurance, vitality } = useGameStore();
  const { playSfx } = useAudioStore();

  const plan = (insuranceData as any[]).find(i => i.id === 'INS_GLOBAL_VIP');
  const isActive = vitality.activeInsurance?.id === plan?.id;
  const hasLowerPlan = vitality.activeInsurance?.id === 'INS_CORP_GOLD'; // 是否已有下级保险
  const canUpgrade = hasLowerPlan && !isActive; // 可升级状态

  const handleSign = () => {
    if (!plan) return;
    if (isActive) {
      cancelInsurance();
    } else {
      playSfx('sfx_click'); // 钢笔书写声
      signInsurance(plan.id);
    }
  };

  if (!plan) return null;

  return (
    <div className="relative w-[600px] h-[350px] bg-[#0a0a0a] rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] border border-[#333] flex flex-col p-10 overflow-hidden group">
      {/* 背景纹理：皮革 */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/black-leather.png')] opacity-80" />
      
      {/* 装饰金边 */}
      <div className="absolute inset-4 border border-[#d4af37] opacity-30 rounded-lg pointer-events-none" />
      
      {/* 内容层 */}
      <div className="relative z-10 flex flex-col h-full justify-between">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-[#d4af37] font-serif text-3xl tracking-[0.2em] uppercase">Apex <span className="text-white/20">Biosciences</span></h2>
            <p className="text-[#d4af37]/60 font-serif text-xs tracking-widest mt-1">IMMORTALITY PROTOCOL ALPHA</p>
          </div>
          <div className="w-12 h-12 border border-[#d4af37] rounded-full flex items-center justify-center opacity-50">
            <span className="text-[#d4af37] font-serif text-2xl">A</span>
          </div>
        </div>

        <div className="flex items-center gap-8 pl-2">
          <div className="w-16 h-12 bg-[#d4af37]/20 rounded bg-gradient-to-br from-yellow-900/0 to-yellow-600/20 backdrop-blur-sm border border-[#d4af37]/30 flex items-center justify-center">
            <div className="w-8 h-6 border border-[#d4af37]/50 rounded-[2px]" />
          </div>
          <div className="font-mono text-[#d4af37] text-xl tracking-[0.15em] shadow-black drop-shadow-md">
            •••• •••• •••• 9999
          </div>
        </div>

        <div className="flex justify-between items-end border-t border-[#d4af37]/20 pt-6">
          <div>
             <p className="text-[#888] text-[8px] uppercase tracking-widest mb-1">MEMBER SIGNATURE</p>
             <button 
                onClick={handleSign}
                className="font-handwriting text-2xl text-white/90 border-b border-[#d4af37]/40 pb-1 min-w-[200px] text-left hover:text-[#d4af37] transition-colors focus:outline-none"
             >
                {isActive ? "Sir. Pixel Player" : canUpgrade ? "Upgrade to Immortality..." : "Sign Here..."}
             </button>
          </div>

          <div className="text-right">
            <p className="text-[#d4af37] font-serif text-lg">
              {isActive ? 'ACTIVE' : canUpgrade ? 'UPGRADE AVAILABLE' : 'INVITATION ONLY'}
            </p>
            <button onClick={onClose} className="text-[#555] text-[10px] hover:text-white uppercase mt-2 tracking-widest">
              Close
            </button>
          </div>
        </div>
      </div>

      {/* 光效扫光 */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
    </div>
  );
};