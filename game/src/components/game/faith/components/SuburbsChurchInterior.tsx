import React, { useState } from 'react';
import { placeholderBackgrounds, placeholderIcons, placeholderEffects } from '../utils/placeholderAssets';

interface Props {
  gold: number;
  onSubscribe: (tier: 'BASIC' | 'PREMIUM') => void;
  onAttendSeminar: () => void;
  onClose: () => void;
}

export const SuburbsChurchInterior: React.FC<Props> = ({ gold, onSubscribe, onAttendSeminar, onClose }) => {
  const [activeTab, setActiveTab] = useState<'GIVE' | 'EVENTS'>('GIVE');
  const [processing, setProcessing] = useState(false);

  const handleAction = (action: () => void) => {
    setProcessing(true);
    setTimeout(() => {
      action();
      setProcessing(false);
    }, 1000); // 模拟网络请求
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center select-none bg-gray-100 overflow-hidden">
      
      {/* 1. 背景：明亮的大厅 (模糊) */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center blur-sm opacity-80"
        style={{ 
          background: placeholderBackgrounds.suburbs_church_interior,
        }}
      >
        <div className="absolute inset-0 bg-white/40" />
      </div>

      {/* 2. 前景：iPad Pro 风格自助终端 */}
      <div className="relative z-10 w-[600px] h-[500px] bg-white rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.2)] border-8 border-gray-900 flex flex-col overflow-hidden transform transition-transform hover:scale-[1.01]">
        
        {/* 顶部状态栏 */}
        <div className="h-8 bg-gray-100 flex items-center justify-between px-4 border-b border-gray-200">
          <div className="flex gap-1">
            <div className="w-2 h-2 rounded-full bg-red-400" />
            <div className="w-2 h-2 rounded-full bg-yellow-400" />
            <div className="w-2 h-2 rounded-full bg-green-400" />
          </div>
          <div className="text-[10px] text-gray-400 font-mono">GraceLife OS v2.0</div>
        </div>

        {/* 应用头部 */}
        <div className="p-6 bg-blue-600 text-white flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">Welcome, Partner</h2>
            <p className="text-xs text-blue-100 opacity-80">Membership Status: Active</p>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase opacity-70">Credit Balance</div>
            <div className="font-mono text-lg font-bold">${gold.toFixed(2)}</div>
          </div>
        </div>

        {/* 导航栏 */}
        <div className="flex border-b border-gray-200">
          <button 
            onClick={() => setActiveTab('GIVE')}
            className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-colors
              ${activeTab === 'GIVE' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-400 hover:text-gray-600'}
            `}
          >
            Auto-Giving
          </button>
          <button 
            onClick={() => setActiveTab('EVENTS')}
            className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-colors
              ${activeTab === 'EVENTS' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-400 hover:text-gray-600'}
            `}
          >
            Seminars
          </button>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 p-8 bg-gray-50 relative">
          
          {/* Loading 遮罩 */}
          {processing && (
            <div className="absolute inset-0 bg-white/80 z-20 flex flex-col items-center justify-center">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-2" />
              <div className="text-xs text-blue-600 font-bold uppercase">Processing Transaction...</div>
            </div>
          )}

          {activeTab === 'GIVE' ? (
            <div className="space-y-4">
              <p className="text-xs text-gray-500 text-center mb-6">
                "Bring the whole tithe into the storehouse." — Malachi 3:10
              </p>
              
              <div 
                onClick={() => handleAction(() => onSubscribe('BASIC'))}
                className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:border-blue-500 hover:shadow-md cursor-pointer transition-all flex justify-between items-center group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-lg group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">🌱</div>
                  <div>
                    <h3 className="font-bold text-gray-800">Seed Sower Plan</h3>
                    <p className="text-[10px] text-gray-500">Monthly Support</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-gray-800">$50.00</div>
                  <div className="text-[9px] text-gray-400">/ month</div>
                </div>
              </div>

              <div 
                onClick={() => handleAction(() => onSubscribe('PREMIUM'))}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 rounded-xl shadow-md cursor-pointer transform hover:scale-[1.02] transition-all flex justify-between items-center text-white relative overflow-hidden"
              >
                <div 
                  className="absolute inset-0 opacity-20 animate-pulse-slow"
                  style={{ backgroundImage: placeholderEffects.sparkles, backgroundSize: '20px 20px' }}
                />
                <div className="relative z-10 flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-lg">💎</div>
                  <div>
                    <h3 className="font-bold">Kingdom Builder</h3>
                    <p className="text-[10px] text-blue-100">VIP Access + Networking</p>
                  </div>
                </div>
                <div className="relative z-10 text-right">
                  <div className="text-sm font-bold">$200.00</div>
                  <div className="text-[9px] text-blue-200">/ month</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 h-full flex flex-col">
               <div className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm flex-1">
                 <div className="h-24 bg-orange-100 relative flex items-center justify-center">
                   <div className="text-6xl">
                     {placeholderIcons.seminar_banner}
                   </div>
                   <div className="absolute inset-0 flex items-center justify-center">
                     <span className="bg-white/90 px-3 py-1 rounded text-xs font-bold uppercase text-orange-600 shadow-sm">
                       Featured Event
                     </span>
                   </div>
                 </div>
                 <div className="p-4">
                   <h3 className="font-bold text-gray-800">Faith & Finance Workshop</h3>
                   <p className="text-[10px] text-gray-500 mt-1 mb-3">
                     Learn biblical principles for wealth creation. Network with local business leaders.
                   </p>
                   <button 
                     onClick={() => handleAction(onAttendSeminar)}
                     className="w-full py-2 bg-gray-900 text-white rounded-lg text-xs font-bold uppercase hover:bg-gray-800 transition-colors"
                   >
                     Register Now (Free)
                   </button>
                 </div>
               </div>
            </div>
          )}
        </div>

        {/* 底部 Logo */}
        <div className="p-3 bg-white border-t border-gray-100 flex justify-center">
          <div className="text-xl opacity-30 grayscale">
            {placeholderIcons.logo_small}
          </div>
        </div>

      </div>

      <button 
        onClick={onClose}
        className="absolute top-8 right-8 text-gray-500 hover:text-gray-800 font-bold bg-white/80 px-4 py-2 rounded-full shadow-lg"
      >
        Sign Out
      </button>

    </div>
  );
};
