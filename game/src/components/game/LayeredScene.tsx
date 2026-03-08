import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { useI18n } from '@/i18n';
// ❌ [移除] 旧的侧边栏
// import { BankSidebar } from './BankSidebar'; 
import { FaithModal } from './FaithModal';
import CLASSES_DATA from '@/assets/data/classes.json';

// ✅ [新增] 引入新的独立模态框
import { BankModal } from './BankModal';
import { InsuranceModal } from './InsuranceModal';

/**
 * @deprecated 此组件当前未被使用，保留用于可能的未来场景（如地图探索）
 * 如需使用，请传入单张完整场景图（image）
 */
interface LayeredSceneProps {
  /** 完整场景图（单张） */
  image: string;
  /** @deprecated 旧格式前景图，已合并到 image */
  eventImage?: string;
  playerImage?: string;
  isGlitch?: boolean;
}

export const LayeredScene: React.FC<LayeredSceneProps> = ({
  image,
  eventImage,
  playerImage,
  isGlitch = false,
}) => {
  // 兼容旧格式：如果传入了 eventImage 但没有传入 image，使用 eventImage
  const sceneImage = image || eventImage || '';
  const { t } = useI18n();
  // 1. 获取阶级配置
  const currentClass = useGameStore(s => s.vitality.identity.currentClass);
  
  // 2. 获取 UI 状态控制方法 & 状态值
  const { 
    setFaithOpen,
    isBankOpen,      // ✅ 获取状态，传给 Modal
    setBankOpen,
    isInsuranceOpen, // ✅ 获取状态，传给 Modal
    setInsuranceOpen // ✅ 获取方法
  } = useGameStore();

  const [bgLoaded, setBgLoaded] = useState(false);

  // 3. 鼠标视差效果 (节流优化版)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const throttleRef = useRef<number | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (throttleRef.current) return;
      
      throttleRef.current = requestAnimationFrame(() => {
        const xPct = (e.clientX / window.innerWidth) - 0.5;
        const yPct = (e.clientY / window.innerHeight) - 0.5;
        setMousePos({ x: xPct * 15, y: yPct * 15 });
        throttleRef.current = null;
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (throttleRef.current) cancelAnimationFrame(throttleRef.current);
    };
  }, []);
  
  const bgTransform = { x: -mousePos.x, y: -mousePos.y };
  const fgTransform = { x: mousePos.x * 0.3, y: mousePos.y * 0.3 };

  // 4. 视觉主题配置
  const currentClassData = useMemo(() => {
    return (CLASSES_DATA as any[]).find(c => c.id === currentClass);
  }, [currentClass]);

  const fallbackGradient = useMemo(() => {
    return currentClassData?.visualTheme?.fallbackGradient || 'linear-gradient(to bottom, #1e130c, #000000)';
  }, [currentClassData]);

  const filterStyle = useMemo(() => {
    const base = currentClassData?.visualTheme?.filter || '';
    return `${base} ${isGlitch ? 'blur(2px) contrast(2)' : ''}`;
  }, [currentClassData, isGlitch]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-black">
      
      {/* Layer 0: Background */}
      <div 
        className="absolute inset-[-5%] w-[110%] h-[110%] bg-cover bg-center transition-transform duration-200 ease-out"
        style={{ 
          transform: `translate(${bgTransform.x}px, ${bgTransform.y}px)`,
          background: bgLoaded ? `url(${sceneImage})` : fallbackGradient,
          filter: filterStyle,
          willChange: 'transform'
        }}
      >
        <img 
          src={sceneImage} 
          className="hidden" 
          onLoad={() => setBgLoaded(true)} 
          onError={() => setBgLoaded(false)} 
        />
      </div>

      {/* Layer 1: Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)] pointer-events-none" />
      
      {/* 前景层 - 已不再需要，因为使用单张完整场景图 */}

      {/* Layer 2: Glitch Overlay */}
      {isGlitch && (
        <div className="absolute inset-0 opacity-30 mix-blend-hard-light pointer-events-none animate-pulse">
           <div className="w-full h-full bg-[url('/assets/textures/noise.svg')]" />
        </div>
      )}
      
      {/* Layer 3: Player Silhouette */}
      {playerImage && (
        <div 
          className="absolute -bottom-10 left-10 w-[400px] h-[600px] bg-contain bg-no-repeat bg-bottom pointer-events-none opacity-80 transition-transform duration-200 ease-out"
          style={{ 
            transform: `translate(${fgTransform.x}px, ${fgTransform.y}px)`, 
            backgroundImage: `url(${playerImage})`, 
            zIndex: 20,
            willChange: 'transform'
          }}
        />
      )}

      {/* Layer 4: HUD Interaction Layer */}
      <div className="absolute top-24 right-4 z-50 flex flex-col gap-4 pointer-events-auto">
        
        {/* 1. 信仰/精神按钮 */}
        <button 
          onClick={() => setFaithOpen(true)}
          className="w-12 h-12 bg-black/60 border border-zinc-600 hover:border-yellow-500 hover:bg-zinc-900 transition-all rounded-sm flex items-center justify-center group relative shadow-pixel-sm backdrop-solid-dark"
        >
          <span className="text-xl group-hover:scale-110 transition-transform">👁️</span>
          <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 text-xs bg-black text-white px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-zinc-700 pointer-events-none">
            {t('faith.title')}
          </span>
        </button>

        {/* 2. 银行/信用按钮 */}
        <button 
          onClick={() => setBankOpen(true)}
          className="w-12 h-12 bg-black/60 border border-zinc-600 hover:border-blue-500 hover:bg-zinc-900 transition-all rounded-sm flex items-center justify-center group relative shadow-pixel-sm backdrop-solid-dark"
        >
          <span className="text-xl group-hover:scale-110 transition-transform">💳</span>
          <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 text-xs bg-black text-white px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-zinc-700 pointer-events-none">
            {t('bank.credit')}
          </span>
        </button>

      </div>

      {/* Layer 5: Modals & Sidebars */}
      
      {/* 宗教模态框 (根据区域渲染不同场景) */}
      <FaithModal /> 
      
      {/* ✅ [新增] 银行模态框 (内部根据 RegionID 渲染不同场景) */}
      <BankModal isOpen={isBankOpen} onClose={() => setBankOpen(false)} />
      
      {/* ✅ [新增] 保险模态框 (独立功能) */}
      <InsuranceModal isOpen={isInsuranceOpen} onClose={() => setInsuranceOpen(false)} />
      
    </div>
  );
};