import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/useGameStore';
import { useAudioStore } from '@/store/useAudioStore';
import ARCHIVES from '@/assets/data/archives.json';

interface BlackBoxProps {
  onClose: () => void;
}

export const BlackBox: React.FC<BlackBoxProps> = ({ onClose }) => {
  const unlockedIds = useGameStore(s => s.unlockedArchives);
  const viewingId = useGameStore(s => s.viewingArchive);
  
  // 核心逻辑：如果是从事件触发的 (viewingId存在)，先进入 IMPACT 阶段；否则直接进入阅读器
  const [mode, setMode] = useState<'IMPACT' | 'READER'>(viewingId ? 'IMPACT' : 'READER');
  const [selectedId, setSelectedId] = useState<string | null>(viewingId || null);
  
  const { playSfx } = useAudioStore();

  const currentDoc = selectedId ? ARCHIVES.find(a => a.id === selectedId) : null;

  // 自动同步选中状态
  useEffect(() => {
    if (viewingId) setSelectedId(viewingId);
  }, [viewingId]);

  // 音效触发
  useEffect(() => {
    if (mode === 'IMPACT') {
      // 模拟拍桌子的声音 (如果有对应的sfx)
      playSfx('sfx_click'); // 暂时用 click 代替，建议添加一个重击音效
    }
  }, [mode, playSfx]);

  const handleSelect = (id: string) => {
    playSfx('sfx_click');
    setSelectedId(id);
  };

  // --- 阶段一：档案拍脸动画 (Impact Overlay) ---
  if (mode === 'IMPACT' && currentDoc) {
    return (
      <div 
        className="fixed inset-0 z-[5000] flex items-center justify-center cursor-pointer"
        onClick={() => setMode('READER')} // 点击任意处进入阅读器
      >
        {/* 透明背景，透出后面的游戏画面 */}
        <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" />

        <motion.div
          // 拍桌子动画：从大到小，带一点随机旋转
          initial={{ scale: 3, opacity: 0, rotate: Math.random() * 10 - 5 }}
          animate={{ scale: 1, opacity: 1, rotate: Math.random() * 4 - 2 }}
          transition={{ type: "spring", stiffness: 300, damping: 15 }}
          className="relative w-[90vw] max-w-md bg-[#f0f0f0] shadow-2xl p-6 md:p-10 rotate-1 border border-gray-300"
          style={{ 
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23d4d4d4' fill-opacity='0.4'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' /%3E%3C/g%3E%3C/svg%3E")`
          }}
        >
          {/* 装饰：回形针 */}
          <div className="absolute -top-4 right-10 w-4 h-12 bg-gray-400 rounded-full border-2 border-gray-500 shadow-sm z-10" />

          {/* 档案头部 */}
          <div className="border-b-2 border-black/80 pb-2 mb-4 flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-black uppercase tracking-tighter text-black">{currentDoc.title}</h2>
              <p className="font-mono text-[10px] text-gray-600 mt-1">CASE_ID: {currentDoc.id} // DECLASSIFIED</p>
            </div>
            <div className="w-16 h-16 bg-gray-200 border border-gray-400 grayscale contrast-125 overflow-hidden">
               {currentDoc.image && <img src={currentDoc.image} className="w-full h-full object-cover mix-blend-multiply" />}
            </div>
          </div>

          {/* 档案摘要 (只显示一部分) */}
          <div className="font-serif text-lg leading-snug text-gray-900 opacity-80 blur-[0.5px] line-clamp-6">
            {currentDoc.flavorText}
          </div>

          {/* 底部提示 */}
          <div className="mt-8 text-center text-xs font-mono text-gray-500 animate-pulse">
            [ TAP TO EXAMINE ]
          </div>

          {/* 印章动画：延迟 0.8秒 后出现 */}
          <motion.div
            initial={{ scale: 2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.8, type: "spring", stiffness: 500, damping: 20 }}
            className="absolute bottom-10 right-6 rotate-[-15deg] pointer-events-none mix-blend-multiply"
          >
            <div className="border-[6px] border-red-700 text-red-700 px-4 py-2 font-black text-2xl md:text-4xl tracking-widest opacity-80 mask-grunge">
              TRUTH VERIFIED
            </div>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // --- 阶段二：Microfilm Reader (原本的界面) ---
  return (
    <div className="fixed inset-0 z-[5000] bg-black/95 flex items-center justify-center p-2 md:p-8 backdrop-blur-xl animate-in fade-in duration-500">
      
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
          {/* 屏幕效果 */}
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
              {/* 档案图片 */}
              {currentDoc.image && (
                <div className="mb-8 relative group">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-32 h-8 bg-yellow-200/80 rotate-[-2deg] shadow-sm z-10 flex items-center justify-center text-[10px] font-mono tracking-widest text-yellow-900/50">
                    EVIDENCE_#{(Math.random() * 1000).toFixed(0)}
                  </div>
                  <div className="border-4 border-white shadow-xl rotate-1 transition-transform duration-500 group-hover:rotate-0 overflow-hidden bg-gray-100">
                    <img 
                      src={currentDoc.image}
                      alt="Evidence"
                      className="w-full h-auto object-cover grayscale contrast-125 sepia-[0.3] opacity-90 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700"
                    />
                    <div className="absolute inset-0 bg-[url('/assets/textures/noise.svg')] opacity-20 pointer-events-none mix-blend-multiply" />
                  </div>
                  <div className="text-center mt-2 text-[10px] font-mono text-gray-500 italic">
                    Fig 1. Photographic Evidence recovered from site.
                  </div>
                </div>
              )}

              {/* 正文 */}
              <div className="text-base md:text-xl leading-relaxed text-justify space-y-6 max-w-2xl font-medium">
                <p>{currentDoc.flavorText}</p>
                <p className="bg-black text-black select-none w-1/2 opacity-20 transform -rotate-1">REDACTED CONTENT</p>
              </div>

              {/* 盖章 */}
              <div className="mt-12 opacity-70 rotate-[-12deg] border-4 border-red-700 text-red-700 inline-block px-4 py-1 font-black text-2xl tracking-widest mix-blend-multiply select-none">
                TRUTH VERIFIED
              </div>

              {/* 接受现实按钮 */}
              <div className="mt-16 pt-8 border-t border-gray-400/30 flex justify-center pb-8">
                <button
                  onClick={() => {
                    playSfx('sfx_click');
                    onClose();
                  }}
                  className="
                    group relative px-8 py-3 
                    bg-transparent hover:bg-black/5 
                    border-2 border-black/80 
                    text-black font-mono font-bold tracking-[0.2em]
                    transition-all duration-300
                  "
                >
                  <span className="group-hover:mr-2 transition-all duration-300">
                    [ 接受现实 ]
                  </span>
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    -&gt;
                  </span>
                </button>
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