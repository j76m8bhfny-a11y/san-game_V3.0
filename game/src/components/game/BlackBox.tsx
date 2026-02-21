import React, { useState, useEffect, useMemo } from 'react';
import { useI18n } from '@/i18n';
import { motion } from 'framer-motion';
import { useGameStore } from '@/store/useGameStore';
import { useAudioStore } from '@/store/useAudioStore';
import ARCHIVES from '@/assets/data/archives.json';
import ENDINGS from '@/assets/data/endings.json';
// ✅ 1. 引入配置文件
import NARRATIVE_RULES from '@/assets/data/rules/narrative_rules.json';
import { random } from '@/utils/random';

interface BlackBoxProps {
  onClose: () => void;
}

type ViewMode = 'IMPACT' | 'GRID' | 'READER';
// ✅ 将 Category 类型放宽为 string，因为它是从 JSON 读取的
type Category = string; 

export const BlackBox: React.FC<BlackBoxProps> = ({ onClose }) => {
  const { t } = useI18n();
  const unlockedIds = useGameStore(s => s.unlockedArchives) || [];
  const achievedEndings = useGameStore(s => s.achievedEndings) || [];
  const viewingId = useGameStore(s => s.viewingArchive);
  
  // ✅ 2. 获取配置数据
  const { categories } = NARRATIVE_RULES.archives;
  const { impactAnimation } = NARRATIVE_RULES.ui;

  const [mode, setMode] = useState<ViewMode>(viewingId ? 'IMPACT' : 'GRID');
  // 默认选中配置中的第一个分类 (通常是 HOMELESS)
  const [category, setCategory] = useState<Category>(categories[0]?.id || 'HOMELESS');
  const [selectedId, setSelectedId] = useState<string | null>(viewingId || null);
  
  const { playSfx } = useAudioStore();

  // --- 统一文档类型结构 ---
  const currentDoc = useMemo(() => {
    if (!selectedId) return null;
    
    const arch = ARCHIVES.find(a => a.id === selectedId);
    if (arch) return { ...arch, type: 'ARCHIVE' };
    
    const end = ENDINGS.find(e => e.id === selectedId);
    if (end) return { 
      id: end.id, 
      title: end.title, 
      flavorText: end.description, 
      image: undefined, 
      type: 'ENDING'
    };
    
    return null;
  }, [selectedId]);

  useEffect(() => {
    if (viewingId) {
      setSelectedId(viewingId);
      setMode('IMPACT');
    }
  }, [viewingId]);

  const openItem = (id: string, _isEnding = false) => {
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

  // --- ✅ 3. 重构数据过滤逻辑 ---
  const filteredList = useMemo(() => {
    if (category === 'ENDING') return ENDINGS;

    // 从配置中找到当前选中的分类对象
    const currentCatConfig = categories.find(c => c.id === category);
    
    return ARCHIVES.filter(item => {
      // 策略 A: 如果配置了特定前缀 (如 "No.W")，必须匹配前缀
      if (currentCatConfig?.prefix) {
        return item.id.startsWith(currentCatConfig.prefix);
      }
      
      // 策略 B: 如果是通用类 (如 HOMELESS，prefix为null)，则排除所有其他已知前缀
      // 这里的逻辑是：如果不属于 工人、中产、资本家，那就属于流浪汉
      const allKnownPrefixes = categories
          .map(c => c.prefix)
          .filter((p): p is string => !!p); // 提取出 ["No.W", "No.M", "No.C"]
          
      return !allKnownPrefixes.some(prefix => item.id.startsWith(prefix));
    });
  }, [category, categories]);

  // --- IMPACT 模式 ---
  if (mode === 'IMPACT' && currentDoc) {
     return (
       <div 
        className="fixed inset-0 z-[5000] flex items-center justify-center cursor-pointer"
        onClick={() => setMode('READER')} 
      >
        <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" />
        <motion.div
          // ✅ 4. 使用配置中的动画参数
          initial={{
            scale: impactAnimation.initialScale,
            opacity: 0,
            rotate: random() * (impactAnimation.randomRotationRange[1] - impactAnimation.randomRotationRange[0]) + impactAnimation.randomRotationRange[0]
          }}
          animate={{
            scale: 1,
            opacity: 1,
            rotate: random() * (impactAnimation.settleRotationRange[1] - impactAnimation.settleRotationRange[0]) + impactAnimation.settleRotationRange[0]
          }}
          transition={{ type: "spring", stiffness: impactAnimation.stiffness, damping: impactAnimation.damping }}
          className="relative w-[90vw] max-w-md bg-[#f0f0f0] shadow-2xl p-6 md:p-10 rotate-1 border border-gray-300"
          style={{ backgroundImage: `url("/assets/textures/paper_texture.png")` }} 
        >
           <div className="absolute -top-4 right-10 w-4 h-12 bg-gray-400 rounded-full border-2 border-gray-500 shadow-sm z-10" />
           <div className="border-b-2 border-black/80 pb-2 mb-4">
             <h2 className="text-3xl font-black uppercase tracking-tighter text-black">{currentDoc.title}</h2>
             <p className="font-mono text-[10px] text-gray-600 mt-1">CASE_ID: {currentDoc.id}</p>
           </div>
           <div className="font-serif text-lg leading-snug text-gray-900 line-clamp-6">
             {currentDoc.flavorText.replace(/【.*?】/g, '')}
           </div>
           <div className="mt-8 text-center text-xs font-mono text-gray-500 animate-pulse">[ {t('archive.tapToRead')} ]</div>
           <motion.div
            initial={{ scale: 2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="absolute bottom-10 right-6 rotate-[-15deg] mix-blend-multiply"
          >
            <div className="border-[6px] border-red-700 text-red-700 px-4 py-2 font-black text-2xl tracking-widest opacity-80">
              {t('archive.verified')}
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
          <span className="text-gray-400 font-mono tracking-widest text-xs">{t('archive.database')}</span>
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-white font-mono text-xs uppercase">[ {t('common.close')} ]</button>
      </div>

      {/* --- GRID 视图 --- */}
      {mode === 'GRID' && (
        <div className="w-full max-w-5xl h-[85vh] mt-12 flex flex-col">
          
          {/* ✅ 5. 动态渲染标签栏 */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2 px-2 md:justify-center">
            {categories.map(tab => (
              <button
                key={tab.id}
                onClick={() => { playSfx('sfx_click'); setCategory(tab.id); }}
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
                const isUnlocked = isEnding 
                  ? achievedEndings.includes(item.id)
                  : unlockedIds.includes(item.id);
                
                // 安全获取图片
                const itemImage = (item as any).image;

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
                      <>
                        <div className="flex-1 w-full overflow-hidden relative grayscale group-hover:grayscale-0 transition-all p-2">
                           {itemImage ? (
                             <img src={itemImage} className="w-full h-full object-cover mix-blend-multiply opacity-80" />
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
                      <div className="w-full h-full flex flex-col items-center justify-center relative">
                        <div className="mb-2 opacity-30">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-500">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                          </svg>
                        </div>
                        <span className="text-gray-600 font-mono text-xs tracking-widest font-bold">
                          {t('archive.locked')}
                        </span>
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

      {/* --- READER 视图 --- */}
      {mode === 'READER' && currentDoc && (
        <div className="w-full max-w-6xl h-[85vh] mt-8 flex flex-col items-center justify-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full h-full bg-[#f0e6d2] text-[#1a1a1a] shadow-2xl overflow-hidden flex flex-col md:flex-row relative rounded-sm"
          >
             <div className="absolute inset-0 bg-[url('/assets/textures/noise.svg')] opacity-30 mix-blend-multiply pointer-events-none z-0" />

             {/* 左侧文字区 */}
             <div className="w-full md:w-[55%] p-8 md:p-12 overflow-y-auto custom-scrollbar relative z-10 border-r border-[#d4c5a9]">
                <div className="border-b-4 border-black mb-6 pb-4">
                  <div className="flex justify-between items-end mb-2">
                     <span className="font-mono text-[10px] tracking-widest text-gray-600 uppercase">
                       {category === 'ENDING' ? t('archive.endingRecord') : `${t('archive.classified')} // ${currentDoc.id}`}
                     </span>
                     <span className="font-mono text-[10px] bg-black text-white px-1">
                       {category === 'ENDING' ? t('archive.final') : t('archive.topSecret')}
                     </span>
                  </div>
                  <h1 className="text-4xl md:text-5xl font-black font-serif uppercase leading-[0.9] tracking-tighter">
                    {currentDoc.title}
                  </h1>
                </div>

                <div className="font-serif text-lg leading-relaxed text-justify text-gray-900">
                  {renderFormattedText(currentDoc.flavorText)}
                  
                  {category !== 'ENDING' && (
                    <p className="bg-black/90 text-transparent select-none w-3/4 transform rotate-[0.5deg] mt-4 opacity-30">
                      [ 数据已删除 ]
                    </p>
                  )}
                </div>
             </div>

             {/* 右侧图片区 */}
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
                      <div className="font-mono text-xs">{t('archive.noVisual')}</div>
                    </div>
                  </div>
                )}

                <div className="mt-auto w-full flex justify-center">
                  <button
                    onClick={() => { playSfx('sfx_click'); handleCloseReader(); }}
                    className="px-8 py-3 bg-[#1a1a1a] text-[#f0e6d2] font-mono font-bold tracking-[0.2em] text-sm hover:bg-red-900 transition-colors shadow-lg"
                  >
                    {viewingId ? `[ ${t('archive.accept')} ]` : `[ ${t('common.back')} ]`}
                  </button>
                </div>
             </div>
          </motion.div>
        </div>
      )}

    </div>
  );
};