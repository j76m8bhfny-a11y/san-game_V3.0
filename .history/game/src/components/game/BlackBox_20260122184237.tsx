import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/useGameStore';
import { useAudioStore } from '@/store/useAudioStore';
import ARCHIVES from '@/assets/data/archives.json';

interface BlackBoxProps {
  onClose: () => void;
}

type ViewMode = 'IMPACT' | 'GRID' | 'READER';

export const BlackBox: React.FC<BlackBoxProps> = ({ onClose }) => {
  const unlockedIds = useGameStore(s => s.unlockedArchives);
  const viewingId = useGameStore(s => s.viewingArchive);
  
  // 状态初始化逻辑：
  // 1. 如果有 viewingId (事件触发)，先进入 IMPACT (拍脸模式)
  // 2. 否则进入 GRID (网格列表模式)
  const [mode, setMode] = useState<ViewMode>(viewingId ? 'IMPACT' : 'GRID');
  const [selectedId, setSelectedId] = useState<string | null>(viewingId || null);
  
  const { playSfx } = useAudioStore();
  const currentDoc = selectedId ? ARCHIVES.find(a => a.id === selectedId) : null;

  // 监听 viewingId 变化
  useEffect(() => {
    if (viewingId) {
      setSelectedId(viewingId);
      setMode('IMPACT');
    }
  }, [viewingId]);

  // 音效逻辑
  useEffect(() => {
    if (mode === 'IMPACT') playSfx('sfx_click');
  }, [mode, playSfx]);

  // 切换查看档案
  const openArchive = (id: string) => {
    playSfx('sfx_click');
    setSelectedId(id);
    setMode('READER');
  };

  const handleCloseReader = () => {
    // 如果是事件触发的查看，看完直接关闭整个档案机
    if (viewingId) {
      onClose();
    } else {
      // 否则返回网格列表
      setMode('GRID');
      setSelectedId(null);
    }
  };

  const renderFormattedText = (text: string) => {
    // 1. 使用正则切分：捕获 【...】 部分
    // split(/(【.*?】)/g) 会把匹配到的分隔符也保留在数组中
    const parts = text.split(/(【.*?】)/g);

    return parts.map((part, index) => {
      const trimmed = part.trim();
      if (!trimmed) return null; // 过滤空行

      // 2. 如果是【...】，渲染为居中标题
      if (trimmed.startsWith('【') && trimmed.endsWith('】')) {
        return (
          <div key={index} className="w-full text-center font-bold text-xl my-6 text-black tracking-widest">
            {trimmed}
          </div>
        );
      }

      // 3. 其他内容渲染为普通段落 (移除首字变大)
      return (
        <p key={index} className="mb-4 indent-8 font-medium">
          {trimmed}
        </p>
      );
    });
  };

  // --- 视图 1: IMPACT (拍脸动画，保持不变) ---
  if (mode === 'IMPACT' && currentDoc) {
    return (
      <div 
        className="fixed inset-0 z-[5000] flex items-center justify-center cursor-pointer"
        onClick={() => setMode('READER')} 
      >
        <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" />
        <motion.div
          initial={{ scale: 3, opacity: 0, rotate: Math.random() * 10 - 5 }}
          animate={{ scale: 1, opacity: 1, rotate: Math.random() * 4 - 2 }}
          transition={{ type: "spring", stiffness: 300, damping: 15 }}
          className="relative w-[90vw] max-w-md bg-[#f0f0f0] shadow-2xl p-6 md:p-10 rotate-1 border border-gray-300"
          style={{ backgroundImage: `url("/assets/textures/paper_texture.png")` }} // 建议加个纸张纹理
        >
           {/* (保持之前的拍脸 UI 代码，这里简化展示) */}
           <div className="absolute -top-4 right-10 w-4 h-12 bg-gray-400 rounded-full border-2 border-gray-500 shadow-sm z-10" />
           <div className="border-b-2 border-black/80 pb-2 mb-4">
             <h2 className="text-3xl font-black uppercase tracking-tighter text-black">{currentDoc.title}</h2>
             <p className="font-mono text-[10px] text-gray-600 mt-1">CASE_ID: {currentDoc.id}</p>
           </div>
           <div className="font-serif text-lg leading-snug text-gray-900 opacity-80 blur-[0.5px] line-clamp-6">
             {currentDoc.flavorText}
           </div>
           <div className="mt-8 text-center text-xs font-mono text-gray-500 animate-pulse">[ TAP TO READ ]</div>
           <motion.div
            initial={{ scale: 2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="absolute bottom-10 right-6 rotate-[-15deg] mix-blend-multiply"
          >
            <div className="border-[6px] border-red-700 text-red-700 px-4 py-2 font-black text-2xl tracking-widest opacity-80">
              TRUTH VERIFIED
            </div>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // --- 主容器 (包含 GRID 和 READER) ---
  return (
    <div className="fixed inset-0 z-[5000] bg-[#111] flex items-center justify-center p-4 animate-in fade-in duration-300">
      
      {/* 机器外壳背景 */}
      <div className="absolute inset-0 bg-[url('/assets/textures/noise.svg')] opacity-10 pointer-events-none" />
      
      {/* 顶栏 */}
      <div className="absolute top-0 left-0 right-0 h-16 bg-[#0a0a0a] border-b border-gray-800 flex items-center justify-between px-6 z-10">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          <span className="text-gray-400 font-mono tracking-widest text-xs">MICROFILM_DATABASE</span>
        </div>
        <button 
          onClick={onClose}
          className="text-gray-500 hover:text-white font-mono text-xs uppercase tracking-wider"
        >
          [ POWER OFF ]
        </button>
      </div>

      {/* --- 视图 2: GRID (档案网格) --- */}
      {mode === 'GRID' && (
        <div className="w-full max-w-5xl h-[80vh] mt-12 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
            {ARCHIVES.map((doc) => {
              const isUnlocked = unlockedIds.includes(doc.id);
              return (
                <button
                  key={doc.id}
                  onClick={() => isUnlocked && openArchive(doc.id)}
                  disabled={!isUnlocked}
                  className={`
                    relative group aspect-[3/4] flex flex-col p-4 border transition-all duration-300
                    ${isUnlocked 
                      ? 'bg-[#e5e5e5] border-gray-400 hover:scale-[1.02] hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:border-cyan-500 cursor-pointer' 
                      : 'bg-[#0f0f0f] border-gray-800 cursor-not-allowed opacity-60'}
                  `}
                >
                  {isUnlocked ? (
                    <>
                      {/* 解锁状态：像一个小缩略图 */}
                      <div className="flex-1 bg-white border border-gray-300 mb-3 overflow-hidden relative grayscale group-hover:grayscale-0 transition-all">
                        {doc.image ? (
                          <img src={doc.image} className="w-full h-full object-cover opacity-80 mix-blend-multiply" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300 text-4xl font-serif">A</div>
                        )}
                        {/* 噪点遮罩 */}
                        <div className="absolute inset-0 bg-[url('/assets/textures/noise.svg')] opacity-20" />
                      </div>
                      
                      <div className="text-left">
                        <div className="text-[10px] font-mono text-gray-500 mb-1">{doc.id}</div>
                        <div className="text-xs font-bold text-black leading-tight line-clamp-2 font-serif group-hover:text-cyan-700">
                          {doc.title}
                        </div>
                      </div>

                      {/* 装饰：已读标记 */}
                      <div className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                    </>
                  ) : (
                    <>
                      {/* 未解锁状态 */}
                      <div className="flex-1 flex items-center justify-center bg-black/50 mb-3 border border-dashed border-gray-700">
                        <span className="text-gray-700 font-mono text-2xl">?</span>
                      </div>
                      <div className="text-left space-y-2">
                         <div className="h-2 w-1/3 bg-gray-800 rounded animate-pulse" />
                         <div className="h-3 w-3/4 bg-gray-800 rounded" />
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                         <span className="text-red-500 font-mono text-xs tracking-widest bg-black px-2 py-1">LOCKED</span>
                      </div>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* --- 视图 3: READER (大报纸详情) --- */}
      {mode === 'READER' && currentDoc && (
        <div className="w-full max-w-6xl h-[85vh] mt-8 flex flex-col items-center justify-center">
          
          {/* 报纸容器 */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full h-full bg-[#f0e6d2] text-[#1a1a1a] shadow-2xl overflow-hidden flex flex-col md:flex-row relative rounded-sm"
          >
            {/* 纸张纹理叠加 */}
            <div className="absolute inset-0 bg-[url('/assets/textures/noise.svg')] opacity-30 mix-blend-multiply pointer-events-none z-0" />
            
            {/* 左侧：文字区 (55%) */}
            <div className="w-full md:w-[55%] p-8 md:p-12 overflow-y-auto custom-scrollbar relative z-10 border-r border-[#d4c5a9]">
              
              {/* Header */}
              <div className="border-b-4 border-black mb-6 pb-4">
                <div className="flex justify-between items-end mb-2">
                   <span className="font-mono text-[10px] tracking-widest text-gray-600 uppercase">Classified Document // {currentDoc.id}</span>
                   <span className="font-mono text-[10px] bg-black text-white px-1">TOP SECRET</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-black font-serif uppercase leading-[0.9] tracking-tighter">
                  {currentDoc.title}
                </h1>
              </div>

              {/* Body Text: 👈 核心修改点在这里 */}
              <div className="font-serif text-lg leading-relaxed text-justify text-gray-900">
                
                {/* 调用格式化函数渲染正文 */}
                {renderFormattedText(currentDoc.flavorText)}

              </div>
              
              {/* 盖章区域 (静态) */}
              <div className="mt-12 p-4 border-2 border-dashed border-gray-400/50 inline-block rotate-1">
                 <div className="text-[10px] font-mono text-gray-500 uppercase">Verification Stamp</div>
                 <div className="text-red-800 font-black text-xl tracking-widest mt-1 opacity-70 mix-blend-multiply border-4 border-red-800 px-2 py-1 -rotate-3">
                   VERIFIED
                 </div>
              </div>
            </div>

            {/* 右侧：图片区 (45%) */}
            <div className="w-full md:w-[45%] bg-[#e6dac0] p-8 md:p-12 flex flex-col items-center relative z-10">
              
              {/* 模拟相框 */}
              {currentDoc.image ? (
                <div className="relative w-full aspect-square bg-white p-3 shadow-lg rotate-2 hover:rotate-0 transition-transform duration-500 ease-out mb-6">
                  {/* 胶带 */}
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-24 h-6 bg-[#dcdcdc]/80 rotate-[-3deg] shadow-sm z-20" />
                  
                  <div className="w-full h-full overflow-hidden bg-gray-100 grayscale contrast-125 sepia-[0.2]">
                    <img src={currentDoc.image} className="w-full h-full object-cover mix-blend-multiply" />
                  </div>
                  <div className="mt-2 text-center font-mono text-[10px] text-gray-500">
                    Figure 1.A - Site Evidence
                  </div>
                </div>
              ) : (
                <div className="w-full aspect-square border-2 border-dashed border-gray-400 flex items-center justify-center opacity-30">
                  <span className="font-mono text-xs">NO VISUALS</span>
                </div>
              )}

              {/* 底部按钮区 */}
              <div className="mt-auto w-full flex justify-center">
                <button
                  onClick={() => {
                    playSfx('sfx_click');
                    handleCloseReader();
                  }}
                  className="
                    group px-8 py-3 
                    bg-[#1a1a1a] text-[#f0e6d2]
                    font-mono font-bold tracking-[0.2em] text-sm
                    hover:bg-red-900 transition-colors duration-300
                    shadow-lg
                  "
                >
                  <span className="group-hover:hidden">
                    {viewingId ? "[ 接受现实 ]" : "[ 返回列表 ]"}
                  </span>
                  <span className="hidden group-hover:inline">
                    [ CLOSE FILE ]
                  </span>
                </button>
              </div>

            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
};