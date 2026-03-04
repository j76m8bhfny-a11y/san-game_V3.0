import React, { useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { RegionID, NoviceActionType } from '@/types/schema';
import { placeholderBackgrounds } from '../utils/placeholderAssets';
import { useI18n } from '@/i18n';

interface Props {
  onClose: () => void;
}

export const SuburbsChurchInterior: React.FC<Props> = ({ onClose }) => {
  const { t } = useI18n();
  const { faith, vitality, performNoviceAction, performFaithRite, getFaithMode } = useGameStore();
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'GIVE' | 'EVENTS'>('GIVE');

  // 获取当前模式：NOVICE (新手) | NATIVE (主场) | GUEST (客场)
  const mode = getFaithMode(RegionID.Suburbs);

  const handleAction = (action: () => void) => {
    setProcessing(true);
    setTimeout(() => {
      action();
      setProcessing(false);
    }, 800);
  };

  // 新手行为包装器
  const handleNoviceAction = (type: NoviceActionType) => {
    if (type === NoviceActionType.REJECT) {
        // 拒绝 = 关机/离开
        performNoviceAction(type);
        onClose();
        return;
    }
    handleAction(() => performNoviceAction(type));
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center select-none bg-gray-100 overflow-hidden font-pixel">
      
      {/* 背景 */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center blur-sm opacity-60"
        style={{ background: placeholderBackgrounds.suburbs_church_interior }}
      />

      {/* iPad Pro 终端 */}
      <div className="relative z-10 w-[640px] h-[480px] bg-white rounded-[2rem] shadow-2xl border-8 border-gray-900 flex flex-col overflow-hidden transform transition-all hover:scale-[1.01]">
        
        {/* 顶部状态栏 */}
        <div className="h-6 bg-gray-50 flex items-center justify-between px-4 border-b border-gray-200">
          <div className="flex gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-400" />
            <div className="w-2 h-2 rounded-full bg-yellow-400" />
            <div className="w-2 h-2 rounded-full bg-green-400" />
          </div>
          <div className="text-[9px] text-gray-400 font-mono uppercase">
            {mode === 'NATIVE' ? t('faith.os_version') : t('faith.guest_session')}
          </div>
        </div>

        {/* 屏幕内容区 */}
        <div className="flex-1 flex flex-col relative bg-gray-50">
          
          {/* Loading 遮罩 */}
          {processing && (
            <div className="absolute inset-0 bg-white/90 z-30 flex flex-col items-center justify-center backdrop-blur-sm">
              <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-3" />
              <div className="text-xs text-blue-600 font-bold uppercase tracking-widest">{t('faith.processing')}</div>
            </div>
          )}

          {/* === 分支视图 === */}
          
          {/* 1. 新手模式：应用网格 (App Grid) */}
          {mode === 'NOVICE' && (
            <div className="flex-1 flex flex-col p-8">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-light text-gray-800">{t('faith.hello_visitor')}</h1>
                    <p className="text-xs text-gray-400 mt-1">{t('faith.select_service')}</p>
                </div>

                <div className="grid grid-cols-2 gap-6 px-12">
                    {/* App 1: Donation (奉献) */}
                    <button 
                        onClick={() => handleNoviceAction(NoviceActionType.DEDICATE)}
                        className="flex flex-col items-center gap-2 group"
                    >
                        <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center text-3xl text-white shadow-lg group-hover:scale-105 transition-transform">
                            💰
                        </div>
                        <span className="text-xs font-medium text-gray-600">{t('faith.donate')}</span>
                        <span className="text-[9px] text-gray-400">{t('faith.donate_cost')}</span>
                    </button>

                    {/* App 2: Volunteer (互助) */}
                    <button 
                        onClick={() => handleNoviceAction(NoviceActionType.AID)}
                        className="flex flex-col items-center gap-2 group"
                    >
                        <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center text-3xl text-white shadow-lg group-hover:scale-105 transition-transform">
                            🤝
                        </div>
                        <span className="text-xs font-medium text-gray-600">{t('faith.volunteer')}</span>
                        <span className="text-[9px] text-gray-400">{t('faith.volunteer_cost')}</span>
                    </button>

                    {/* App 3: Bio-Data (献祭) */}
                    <button 
                        onClick={() => handleNoviceAction(NoviceActionType.SACRIFICE)}
                        className="flex flex-col items-center gap-2 group"
                    >
                        <div className="w-16 h-16 bg-red-500 rounded-2xl flex items-center justify-center text-3xl text-white shadow-lg group-hover:scale-105 transition-transform">
                            🩸
                        </div>
                        <span className="text-xs font-medium text-gray-600">{t('faith.bio_data')}</span>
                        <span className="text-[9px] text-gray-400">{t('faith.bio_data_cost')}</span>
                    </button>

                    {/* App 4: Power Off (拒绝) */}
                    <button 
                        onClick={() => handleNoviceAction(NoviceActionType.REJECT)}
                        className="flex flex-col items-center gap-2 group"
                    >
                        <div className="w-16 h-16 bg-gray-700 rounded-2xl flex items-center justify-center text-3xl text-white shadow-lg group-hover:scale-105 transition-transform">
                            🔌
                        </div>
                        <span className="text-xs font-medium text-gray-600">{t('faith.logout')}</span>
                    </button>
                </div>
            </div>
          )}

          {/* 2. 主场模式：完整 OS */}
          {mode === 'NATIVE' && (
            <>
              {/* Header */}
              <div className="bg-blue-600 text-white p-6">
                <div className="flex justify-between items-end">
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight">{t('faith.dashboard_title')}</h1>
                    <p className="text-xs opacity-80 mt-1">{t('faith.member_level')}: {faith.level}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] opacity-60 uppercase">{t('faith.credit_balance')}</div>
                    <div className="font-mono text-xl">${vitality.metrics.gold.toFixed(2)}</div>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-200 bg-white">
                <button 
                    onClick={() => setActiveTab('GIVE')}
                    className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider ${activeTab === 'GIVE' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400'}`}
                >
                    {t('faith.tab_give')}
                </button>
                <button 
                    onClick={() => setActiveTab('EVENTS')}
                    className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider ${activeTab === 'EVENTS' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400'}`}
                >
                    {t('faith.tab_events')}
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 p-6 overflow-y-auto">
                 {activeTab === 'GIVE' ? (
                     <div 
                       onClick={() => handleAction(performFaithRite)}
                       className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-400 cursor-pointer transition-all flex items-center gap-4"
                     >
                       <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-2xl">🌱</div>
                       <div>
                         <h3 className="font-bold text-gray-800">{t('faith.daily_tithe')}</h3>
                         <p className="text-xs text-gray-500">{t('faith.auto_deduct')}</p>
                       </div>
                     </div>
                 ) : (
                     <div className="text-center text-gray-400 text-xs mt-10">{t('faith.no_events')}</div>
                 )}
              </div>
            </>
          )}

          {/* 3. 客场模式：简易界面 */}
          {mode === 'GUEST' && (
             <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <div className="text-4xl grayscale opacity-30 mb-4">✝️</div>
                <h3 className="text-gray-600 font-bold mb-2">{t('faith.ecumenical_title')}</h3>
                <p className="text-xs text-gray-400 max-w-[200px] mb-6">
                  {t('faith.ecumenical_desc')}
                </p>
                <button
                  onClick={() => handleAction(performFaithRite)}
                  className="bg-gray-800 text-white px-8 py-3 rounded-full text-sm font-bold uppercase tracking-widest hover:bg-black transition-colors shadow-lg"
                >
                  {t('faith.execute_rite')}
                </button>
             </div>
          )}

        </div>

        {/* 底部退出栏 */}
        <div className="bg-white border-t border-gray-200 p-3 flex justify-between items-center z-20">
          <div className="text-[10px] text-gray-400">{t('faith.secure_connection')}</div>
          <button onClick={onClose} className="text-xs font-bold text-red-500 hover:text-red-700 uppercase">
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
};