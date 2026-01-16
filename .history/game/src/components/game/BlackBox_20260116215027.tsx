import React, { useState, useEffect } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { useAudioStore } from '@/store/useAudioStore';
import ARCHIVES from '@/assets/data/archives.json';

interface BlackBoxProps {
  onClose: () => void;
}

export const BlackBox: React.FC<BlackBoxProps> = ({ onClose }) => {
  const unlockedIds = useGameStore(s => s.unlockedArchives);
  const viewingId = useGameStore(s => s.viewingArchive); // 获取刚解锁的档案 ID
  const [selectedId, setSelectedId] = useState<string | null>(viewingId || null);
  const { playSfx } = useAudioStore();

  const currentDoc = selectedId ? ARCHIVES.find(a => a.id === selectedId) : null;

  // 自动选中刚解锁的档案
  useEffect(() => {
    if (viewingId) setSelectedId(viewingId);
  }, [viewingId]);

  const handleSelect = (id: string) => {
    playSfx('sfx_click');
    setSelectedId(id);
  };

  return (
    <div className="fixed inset-0 z-[5000] bg-black/95 flex items-center justify-center p-2 md:p-8 backdrop-blur-xl animate-in fade-in duration-300">
      
      {/* 机器外壳 */}
      <div className="w-full max-w-6xl h-[90vh] bg-[#1a1a1a] border border-gray-700 rounded shadow-2xl flex flex-col md:flex-row overflow-hidden relative">
        
        {/* LOGO */}
        <div className="absolute top-4 right-4 text-gray-600 font-black text-[10px] tracking-[0.2em] pointer-events-none z-10">
          MICROFILM_READER_V3.0
        </div>

        {/* 左侧：索引列表 */}
        <div className="w-full md:w-1/3 bg-[#0f0f0f] border-b md:border-b-0 md:border-r border-gray-800 flex flex-col h-1/3 md:h-full">
          <div className="p-4 border-b border-gray-800 bg-gray-900/50">
            <h2 className="text-cyan-600 font-pixel text-xs md:text-sm">ARCHIVE_INDEX</h2>
            <p className="text-gray-600 text-[10px] mt-1">DECRYPTED: {unlockedIds.length} / {ARCHIVES.length}</p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 custom-scrollbar space-y-1">
            {ARCHIVES.map((doc) => {
              const isUnlocked = unlockedIds.includes(doc.id);
              const isSelected = selectedId === doc.id;
              
              return (
                <button
                  key={doc.id}
                  onClick={() => isUnlocked && handleSelect(doc.id)}
                  disabled={!isUnlocked}
                  className={`w-full text-left p-3 border transition-all duration-200 font-mono text-xs md:text-sm
                    ${!isUnlocked ? 'border-transparent text-gray-800 cursor-not-allowed' : 
                      isSelected ? 'border-cyan-600 bg-cyan-900/20 text-cyan-400' : 'border-gray-800 text-gray-500 hover:border-gray-600 hover:text-gray-300'}
                  `}
                >
                  <div className="flex justify-between items-center">
                    <span>{doc.id}</span>
                    {isUnlocked && <span className="opacity-50 text-[10px]">{isSelected ? 'reading...' : 'view'}</span>}
                  </div>
                  <div className="truncate mt-1 opacity-80 text-[10px]">
                    {isUnlocked ? doc.title : '██████████'}
                  </div>
                </button>
              );
            })}
          </div>
          
          <button 
            onClick={() => { playSfx('sfx_click'); onClose(); }}
            className="p-4 border-t border-gray-800 text-red-600 hover:bg-red-900/10 hover:text-red-400 font-bold transition-colors text-xs tracking-widest uppercase"
          >
            [ Eject Tape ]
          </button>
        </div>

        {/* 右侧：阅读区 */}
        <div className="flex-1 bg-[#dcdcdc] relative overflow-hidden flex flex-col h-2/3 md:h-full">
          {/* 屏幕效果：噪点 + 扫描线 + 阴影 */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(0,0,0,0.3)_100%)] pointer-events-none z-20" />
          <div className="absolute inset-0 bg-[url('/assets/textures/noise.svg')] opacity-15 pointer-events-none z-10 mix-blend-multiply" />
          <div className="absolute top-0 left-0 w-full h-1 bg-cyan-500/20 animate-[scan_4s_linear_infinite] pointer-events-none z-10" />
          
          {currentDoc ? (
            <div className="flex-1 overflow-y-auto p-8 md:p-16 relative z-0 text-black font-serif animate-in zoom-in-95 duration-500">
              {/* 文档头部 */}
              <div className="border-b-2 border-black pb-4 mb-6 flex justify-between items-end">
                <div>
                  <h1 className="text-2xl md:text-4xl font-black uppercase tracking-tight leading-none">{currentDoc.title}</h1>
                  <div className="text-[10px] font-mono mt-2 bg-black text-white inline-block px-1">
                    TOP SECRET // DECLASSIFIED
                  </div>
                </div>
              </div>

              {/* 正文 */}
              <div className="text-base md:text-xl leading-relaxed text-justify space-y-6 max-w-2xl font-medium">
                <p>{currentDoc.flavorText}</p>
                {/* 装饰：涂抹痕迹 */}
                <p className="bg-black text-black select-none w-1/2 opacity-20 transform -rotate-1">REDACTED CONTENT</p>
              </div>

              {/* 盖章 */}
              <div className="mt-12 opacity-70 rotate-[-12deg] border-4 border-red-700 text-red-700 inline-block px-4 py-1 font-black text-2xl tracking-widest mix-blend-multiply select-none">
                TRUTH VERIFIED
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center flex-col text-gray-400 z-0 select-none">
              <div className="w-20 h-20 border-4 border-gray-400/50 rounded-full flex items-center justify-center mb-6 animate-pulse">
                <div className="w-4 h-4 bg-gray-400/50 rounded-full" />
              </div>
              <p className="font-mono tracking-widest text-xs">NO MICROFILM LOADED</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};