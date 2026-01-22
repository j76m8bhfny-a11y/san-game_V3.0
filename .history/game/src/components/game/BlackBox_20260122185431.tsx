import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/useGameStore';
import { useAudioStore } from '@/store/useAudioStore';
import ARCHIVES from '@/assets/data/archives.json';
import ENDINGS from '@/assets/data/endings.json'; // 👈 记得导入 endings

interface BlackBoxProps {
  onClose: () => void;
}

type ViewMode = 'IMPACT' | 'GRID' | 'READER';
type Category = 'HOMELESS' | 'WORKER' | 'MIDDLE' | 'CAPITALIST' | 'ENDING';

export const BlackBox: React.FC<BlackBoxProps> = ({ onClose }) => {
  const unlockedIds = useGameStore(s => s.unlockedArchives);
  const achievedEndings = useGameStore(s => s.achievedEndings) || []; // 防空
  const viewingId = useGameStore(s => s.viewingArchive);
  
  const [mode, setMode] = useState<ViewMode>(viewingId ? 'IMPACT' : 'GRID');
  const [category, setCategory] = useState<Category>('HOMELESS'); // 👈 当前标签
  const [selectedId, setSelectedId] = useState<string | null>(viewingId || null);
  
  const { playSfx } = useAudioStore();

  // 计算当前应该显示哪个文档（可能是档案，可能是结局）
  // 结局和档案的数据结构略有不同，这里做统一适配
  const currentDoc = React.useMemo(() => {
    if (!selectedId) return null;
    const arch = ARCHIVES.find(a => a.id === selectedId);
    if (arch) return arch;
    
    const end = ENDINGS.find(e => e.id === selectedId);
    if (end) return { 
      id: end.id, 
      title: end.title, 
      flavorText: end.description, // 结局描述作为正文
      image: undefined // 结局可能没有图片，或者你可以专门配图
    };
    return null;
  }, [selectedId]);

  // 监听 viewingId (事件触发)
  useEffect(() => {
    if (viewingId) {
      setSelectedId(viewingId);
      setMode('IMPACT');
    }
  }, [viewingId]);

  const openItem = (id: string, isEnding = false) => {
    playSfx('sfx_click');
    setSelectedId(id);
    setMode('READER');
  };

  const handleCloseReader = () => {
    if (viewingId) {
      onClose();
    } else {
      setMode('GRID');
      setSelectedId(null);
    }
  };

  // --- 格式化文本函数 (保持不变) ---
  const renderFormattedText = (text: string) => {
    const parts = text.split(/(【.*?】)/g);
    return parts.map((part, index) => {
      const trimmed = part.trim();
      if (!trimmed) return null;
      if (trimmed.startsWith('【') && trimmed.endsWith('】')) {
        return <div key={index} className="w-full text-center font-bold text-xl my-6 text-black tracking-widest">{trimmed}</div>;
      }
      return <p key={index} className="mb-4 font-medium">{trimmed}</p>;
    });
  };

  // --- 数据过滤逻辑 ---
  const getFilteredItems = () => {
    if (category === 'ENDING') return ENDINGS; // 结局特殊处理

    return ARCHIVES.filter(item => {
      const id = item.id;
      if (category === 'WORKER') return id.startsWith('No.W');
      if (category === 'MIDDLE') return id.startsWith('No.M');
      if (category === 'CAPITALIST') return id.startsWith('No.C');
      // 剩下的都归类为流浪汉/通用
      return !id.startsWith('No.W') && !id.startsWith('No.M') && !id.startsWith('No.C');
    });
  };

  const filteredList = getFilteredItems();

  // --- IMPACT 模式 (拍脸动画) ---
  if (mode === 'IMPACT' && currentDoc) {
     // ... (保持原有的 IMPACT 代码不变，为了节省篇幅这里省略，请保留之前的代码)
     // 如果你需要这部分代码，请告诉我，我再发一遍。
     // 假设你保留了之前的 IMPACT 代码块...
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
          style={{ backgroundImage: `url("/assets/textures/paper_texture.png")` }} 
        >
           <div className="absolute -top-4 right-10 w-4 h-12 bg-gray-400 rounded-full border-2 border-gray-500 shadow-sm z-10" />
           <div className="border-b-2 border-black/80 pb-2 mb-4">
             <h2 className="text-3xl font-black uppercase tracking-tighter text-black">{currentDoc.title}</h2>
             <p className="font-mono text-[10px] text-gray-600 mt-1">CASE_ID: {currentDoc.id}</p>
           </div>
           <div className="font-serif text-lg leading-snug text-gray-900 line-clamp-6">
              {/* 简易渲染 */}
             {currentDoc.flavorText.replace(/【.*?】/g, '')}
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

  // --- 主容器 ---
  return (
    <div className="fixed inset-0 z-[5000] bg-[#111] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-[url('/assets/textures/noise.svg')] opacity-10 pointer-events-none" />

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 h-16 bg-[#0a0a0a] border-b border-gray-800 flex items-center justify-between px-6 z-10">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          <span className="text-gray-400 font-mono tracking-widest text-xs">ARCHIVE_DATABASE_V4.0</span>
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-white font-mono text-xs uppercase">[ CLOSE ]</button>
      </div>

      {/* --- GRID 视图 --- */}
      {mode === 'GRID' && (
        <div className="w-full max-w-5xl h-[85vh] mt-12 flex flex-col">
          
          {/* 👈 标签栏 (Tabs) */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2 px-2 md:justify-center">
            {[
              { id: 'HOMELESS', label: '流浪汉' },
              { id: 'WORKER', label: '工人' },
              { id: 'MIDDLE', label: '中产' },
              { id: 'CAPITALIST', label: '资本家' },
              { id: 'ENDING', label: '结局' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => { playSfx('sfx_click'); setCategory(tab.id as Category); }}
                className={`
                  px-6 py-2 text-sm font-bold tracking-wider border-b-2 transition-all shrink-0
                  ${category === tab.id 
                    ? 'border-cyan-500 text-cyan-400 bg-cyan-950/30' 
                    : 'border-transparent text-gray-600 hover:text-gray-400 hover:bg-gray-900'}
                `}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* 网格内容 */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {filteredList.map((item) => {
                const isEnding = category === 'ENDING';
                // 判断解锁状态：如果是结局查 achievedEndings，如果是档案查 unlockedIds
                const isUnlocked = isEnding 
                  ? achievedEndings.includes(item.id)
                  : unlockedIds.includes(item.id);

                return (
                  <button
                    key={item.id}
                    onClick={() => isUnlocked && openItem(item.id, isEnding)}
                    disabled={!isUnlocked}
                    className={`
                      relative group aspect-square flex flex-col border transition-all duration-300 overflow-hidden
                      ${isUnlocked 
                        ? 'bg-[#e5e5e5] border-gray-400 hover:scale-[1.02] hover:shadow-cyan-500/20 hover:border-cyan-500 cursor-pointer' 
                        : 'bg-[#1a1a1a] border-gray-800 cursor-not-allowed'}
                    `}
                  >
                    {isUnlocked ? (
                      // --- 解锁状态 ---
                      <>
                        <div className="flex-1 w-full overflow-hidden relative grayscale group-hover:grayscale-0 transition-all p-2">
                           {/* 如果有图显示图，没图显示大字 ID */}
                           {item.image ? (
                             <img src={item.image} className="w-full h-full object-cover mix-blend-multiply opacity-80" />
                           ) : (
                             <div className="w-full h-full flex items-center justify-center border border-gray-300">
                               <span className="text-4xl font-black text-gray-300/50 select-none">
                                 {isEnding ? 'END' : 'DOC'}
                               </span>
                             </div>
                           )}
                        </div>
                        <div className="h-auto p-2 bg-white border-t border-gray-300 z-10">
                          <div className="text-[9px] font-mono text-gray-500 leading-none mb-1">{item.id}</div>
                          <div className="text-xs font-bold text-black leading-tight line-clamp-1">
                            {item.title}
                          </div>
                        </div>
                      </>
                    ) : (
                      // --- 👈 已加密状态 (田字格灰色) ---
                      <div className="w-full h-full flex flex-col items-center justify-center relative">
                        {/* 锁图标 */}
                        <div className="mb-2 opacity-30">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-500">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                          </svg>
                        </div>
                        {/* 文字 */}
                        <span className="text-gray-600 font-mono text-xs tracking-widest font-bold">
                          已加密
                        </span>
                        {/* 背景斜纹装饰 */}
                        <div className="absolute inset-0 bg-[url('/assets/textures/noise.svg')] opacity-5" />
                        <div className="absolute inset-0 opacity-10 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#000_10px,#000_11px)]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* --- READER 视图 (大报纸) --- */}
      {mode === 'READER' && currentDoc && (
        <div className="w-full max-w-6xl h-[85vh] mt-8 flex flex-col items-center justify-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full h-full bg-[#f0e6d2] text-[#1a1a1a] shadow-2xl overflow-hidden flex flex-col md:flex-row relative rounded-sm"
          >
             {/* 纸张纹理 */}
             <div className="absolute inset-0 bg-[url('/assets/textures/noise.svg')] opacity-30 mix-blend-multiply pointer-events-none z-0" />

             {/* 左侧文字区 */}
             <div className="w-full md:w-[55%] p-8 md:p-12 overflow-y-auto custom-scrollbar relative z-10 border-r border-[#d4c5a9]">
                <div className="border-b-4 border-black mb-6 pb-4">
                  <div className="flex justify-between items-end mb-2">
                     <span className="font-mono text-[10px] tracking-widest text-gray-600 uppercase">
                       {category === 'ENDING' ? 'Ending Record' : `Classified Doc // ${currentDoc.id}`}
                     </span>
                     <span className="font-mono text-[10px] bg-black text-white px-1">
                       {category === 'ENDING' ? 'FINAL' : 'TOP SECRET'}
                     </span>
                  </div>
                  <h1 className="text-4xl md:text-5xl font-black font-serif uppercase leading-[0.9] tracking-tighter">
                    {currentDoc.title}
                  </h1>
                </div>

                <div className="font-serif text-lg leading-relaxed text-justify text-gray-900">
                  {/* 使用格式化函数 */}
                  {renderFormattedText(currentDoc.flavorText)}
                  
                  {category !== 'ENDING' && (
                    <p className="bg-black/90 text-transparent select-none w-3/4 transform rotate-[0.5deg] mt-4 opacity-30">
                      [ 数据已删除 ]
                    </p>
                  )}
                </div>
             </div>

             {/* 右侧图片/装饰区 */}
             <div className="w-full md:w-[45%] bg-[#e6dac0] p-8 md:p-12 flex flex-col items-center relative z-10">
                {currentDoc.image ? (
                  <div className="relative w-full aspect-square bg-white p-3 shadow-lg rotate-2 hover:rotate-0 transition-transform duration-500 mb-6">
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-24 h-6 bg-[#dcdcdc]/80 rotate-[-3deg] shadow-sm z-20" />
                    <img src={currentDoc.image} className="w-full h-full object-cover mix-blend-multiply grayscale contrast-125" />
                  </div>
                ) : (
                  <div className="w-full aspect-square border-4 border-double border-gray-400/50 flex items-center justify-center mb-6">
                    <div className="text-center opacity-40">
                      <div className="text-6xl mb-2">👁️</div>
                      <div className="font-mono text-xs">NO VISUAL RECORD</div>
                    </div>
                  </div>
                )}

                <div className="mt-auto w-full flex justify-center">
                  <button
                    onClick={() => { playSfx('sfx_click'); handleCloseReader(); }}
                    className="px-8 py-3 bg-[#1a1a1a] text-[#f0e6d2] font-mono font-bold tracking-[0.2em] text-sm hover:bg-red-900 transition-colors shadow-lg"
                  >
                    {viewingId ? "[ 接受现实 ]" : "[ 返回列表 ]"}
                  </button>
                </div>
             </div>
          </motion.div>
        </div>
      )}

    </div>
  );
};