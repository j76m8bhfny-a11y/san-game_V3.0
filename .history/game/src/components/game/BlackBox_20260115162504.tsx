import React, { useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import ARCHIVES from '@/assets/data/archives.json';

interface BlackBoxProps {
  onClose: () => void;
}

export const BlackBox: React.FC<BlackBoxProps> = ({ onClose }) => {
  const unlockedIds = useGameStore(s => s.unlockedArchives);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // 获取当前选中的档案详情
  const currentDoc = selectedId ? ARCHIVES.find(a => a.id === selectedId) : null;

  return (
    <div className="fixed inset-0 z-[5000] bg-black/90 flex items-center justify-center p-4 md:p-8 backdrop-blur-md">
      
      {/* 机器外壳 */}
      <div className="w-full max-w-6xl h-[85vh] bg-[#1a1a1a] border-4 border-gray-600 rounded-lg shadow-2xl flex flex-col md:flex-row overflow-hidden relative">
        
        {/* 装饰：微缩胶片机 LOGO */}
        <div className="absolute top-4 right-4 text-gray-500 font-black text-xs tracking-[0.2em] pointer-events-none">
          MICROFILM_READER_V3.0
        </div>

        {/* 左侧：索引列表 (侧边栏) */}
        <div className="w-full md:w-1/3 bg-[#0f0f0f] border-r border-gray-700 flex flex-col">
          <div className="p-4 border-b border-gray-700 bg-gray-800/50">
            <h2 className="text-cyan-500 font-pixel text-lg">ARCHIVE_INDEX</h2>
            <p className="text-gray-500 text-xs mt-1">UNLOCKED: {unlockedIds.length} / {ARCHIVES.length}</p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
            {ARCHIVES.map((doc) => {
              const isUnlocked = unlockedIds.includes(doc.id);
              const isSelected = selectedId === doc.id;
              
              return (
                <button
                  key={doc.id}
                  onClick={() => isUnlocked && setSelectedId(doc.id)}
                  disabled={!isUnlocked}
                  className={`w-full text-left p-3 mb-1 border transition-all duration-200 font-mono text-sm relative group
                    ${!isUnlocked ? 'border-transparent text-gray-700 opacity-50 cursor-not-allowed' : 
                      isSelected ? 'border-cyan-500 bg-cyan-900/20 text-cyan-400' : 'border-gray-800 text-gray-400 hover:border-gray-600 hover:text-gray-200'}
                  `}
                >
                  <div className="flex justify-between items-center">
                    <span>{doc.id}</span>
                    {isUnlocked && <span className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">VIEW &gt;</span>}
                  </div>
                  <div className="truncate text-xs mt-1 opacity-80">
                    {isUnlocked ? doc.title : '██████████'}
                  </div>
                </button>
              );
            })}
          </div>
          
          <button 
            onClick={onClose}
            className="p-4 border-t border-gray-700 text-red-500 hover:bg-red-900/20 hover:text-red-400 font-bold transition-colors text-center"
          >
            [ EJECT TAPE ]
          </button>
        </div>

        {/* 右侧：阅读区 (投影屏幕) */}
        <div className="flex-1 bg-[#e0e5ec] relative overflow-hidden flex flex-col">
          {/* 屏幕玻璃质感遮罩 */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.2)_100%)] pointer-events-none z-20" />
          <div className="absolute inset-0 bg-[url('/assets/textures/noise.svg')] opacity-10 pointer-events-none z-10 mix-blend-multiply" />
          
          {currentDoc ? (
            <div className="flex-1 overflow-y-auto p-8 md:p-12 relative z-0 text-black font-serif">
              {/* 文档头部 */}
              <div className="border-b-2 border-black pb-4 mb-6 flex justify-between items-end">
                <div>
                  <h1 className="text-3xl font-black uppercase tracking-tight">{currentDoc.title}</h1>
                  <div className="text-xs font-mono mt-2 bg-black text-white inline-block px-1">
                    CONFIDENTIAL // DECLASSIFIED
                  </div>
                </div>
                <div className="text-right font-mono text-xs">
                  REF: {currentDoc.id}<br/>
                  ORIGIN: AMERICAN_INSIGHT
                </div>
              </div>

              {/* 正文内容 */}
              <div className="text-lg leading-relaxed text-justify space-y-4">
                <p>{currentDoc.flavorText}</p>
                <p className="opacity-0">.</p> {/* 占位，防止底部太挤 */}
              </div>

              {/* 盖章 */}
              <div className="mt-12 opacity-80 rotate-[-12deg] border-4 border-red-600 text-red-600 inline-block px-4 py-1 font-black text-xl tracking-widest mix-blend-multiply">
                TRUTH VERIFIED
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center flex-col text-gray-400 z-0">
              <div className="w-16 h-16 border-4 border-gray-400 rounded-full flex items-center justify-center mb-4 animate-pulse">
                <div className="w-4 h-4 bg-gray-400 rounded-full" />
              </div>
              <p className="font-mono tracking-widest text-sm">NO TAPE LOADED</p>
              <p className="text-xs mt-2">SELECT AN ARCHIVE FROM THE INDEX</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};