import React, { useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { RegionID, NoviceActionType } from '@/types/schema';
import { placeholderBackgrounds } from '../utils/placeholderAssets';
import { useI18n } from '@/i18n';

interface Props {
  onClose: () => void;
}

export const RustBeltChurchInterior: React.FC<Props> = ({ onClose }) => {
  const { t } = useI18n();
  const { performNoviceAction, performFaithRite, getFaithMode } = useGameStore();
  const [isPreaching, setIsPreaching] = useState(false);

  const mode = getFaithMode(RegionID.RustBelt);

  const handleNoviceAction = (type: NoviceActionType) => {
    if (type === NoviceActionType.REJECT) {
        performNoviceAction(type); // 也会记录拒绝次数
        onClose();
    } else {
        performNoviceAction(type);
    }
  };

  const handleRite = () => {
    setIsPreaching(true);
    setTimeout(() => {
      performFaithRite();
      setIsPreaching(false);
    }, 2000);
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center select-none bg-black overflow-hidden font-pixel">
      
      {/* 背景 */}
      <div 
        className={`absolute inset-0 z-0 bg-cover bg-center transition-all duration-300 
          ${isPreaching ? 'scale-110 brightness-150 blur-md' : 'scale-100 blur-sm brightness-75'}
        `}
        style={{ background: placeholderBackgrounds.rust_church_interior }}
      >
        <div className={`absolute inset-0 mix-blend-overlay opacity-50 ${isPreaching ? 'bg-red-500 animate-pulse' : 'bg-purple-900'}`} />
      </div>

      {/* 核心交互物：传单 / 海报 */}
      <div className={`
        relative z-10 w-[360px] bg-[#f8f5e6] shadow-[0_20px_60px_rgba(0,0,0,0.5)] rotate-1 p-6 text-center
        transform transition-all duration-500 min-h-[500px] flex flex-col
        ${isPreaching ? 'scale-105 rotate-0' : 'hover:-rotate-1'}
      `}>
        {/* 纸张纹理 */}
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cardboard.png')]" />

        <div className="border-4 border-double border-black p-4 h-full flex flex-col items-center flex-1">
          
          <h1 className="text-3xl font-black uppercase tracking-tighter mb-2 leading-none">
            {t('faith.title', { mode })}
          </h1>
          <div className="w-full h-px bg-black mb-4" />

          {/* === 新手模式：勾选单 === */}
          {mode === 'NOVICE' && (
            <div className="w-full text-left space-y-4 mt-2">
                <p className="text-xs font-bold italic text-center mb-4">"{t('faith.serve_question')}"</p>
                
                {/* 选项 1: Support ($) */}
                <div 
                    onClick={() => handleNoviceAction(NoviceActionType.DEDICATE)}
                    className="flex items-center gap-3 cursor-pointer group hover:bg-black/5 p-2 rounded"
                >
                    <div className="w-6 h-6 border-2 border-black flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors"></div>
                    <div>
                        <div className="text-sm font-bold uppercase">{t('faith.donate')}</div>
                        <div className="text-[10px] text-gray-600">{t('faith.donate_desc')}</div>
                    </div>
                </div>

                {/* 选项 2: Volunteer (HP) */}
                <div 
                    onClick={() => handleNoviceAction(NoviceActionType.AID)}
                    className="flex items-center gap-3 cursor-pointer group hover:bg-black/5 p-2 rounded"
                >
                    <div className="w-6 h-6 border-2 border-black flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors"></div>
                    <div>
                        <div className="text-sm font-bold uppercase">{t('faith.volunteer')}</div>
                        <div className="text-[10px] text-gray-600">{t('faith.volunteer_desc')}</div>
                    </div>
                </div>

                {/* 选项 3: Penance (HP) */}
                <div 
                    onClick={() => handleNoviceAction(NoviceActionType.SACRIFICE)}
                    className="flex items-center gap-3 cursor-pointer group hover:bg-black/5 p-2 rounded"
                >
                    <div className="w-6 h-6 border-2 border-black flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors"></div>
                    <div>
                        <div className="text-sm font-bold uppercase">{t('faith.penance')}</div>
                        <div className="text-[10px] text-gray-600">{t('faith.penance_desc')}</div>
                    </div>
                </div>

                <div className="w-full h-px bg-black/20 my-4" />

                {/* 选项 4: Ignore */}
                <button 
                    onClick={() => handleNoviceAction(NoviceActionType.REJECT)}
                    className="w-full py-2 text-xs font-mono text-gray-500 hover:text-red-600 hover:line-through transition-colors"
                >
                    {t('faith.leave')}
                </button>
            </div>
          )}

          {/* === 主场/客场模式 === */}
          {mode !== 'NOVICE' && (
            <div className="flex flex-col h-full justify-between">
                <p className="text-sm font-bold italic mb-6">
                    "{t('faith.slogan', { mode })}"
                </p>
                
                <div className="space-y-4 w-full">
                    <button 
                        onClick={handleRite}
                        disabled={isPreaching}
                        className="w-full py-3 border-2 border-black font-bold hover:bg-black hover:text-white transition-colors uppercase text-xs"
                    >
                        {isPreaching ? t('faith.preaching') : t('faith.pray', { mode })}
                    </button>
                </div>

                <div className="mt-6 text-[10px] text-gray-500 font-mono">
                    {t('faith.chapter_info')}
                </div>
            </div>
          )}
          
        </div>
      </div>

      <button 
        onClick={onClose}
        className="absolute top-8 right-8 text-white/50 hover:text-white font-mono text-xs uppercase"
      >
        {t('common.close')}
      </button>

    </div>
  );
};
