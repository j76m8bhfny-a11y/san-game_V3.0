import React, { useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { BaseScene, ParallaxLayer } from './BaseScene';

// --- 类型定义 ---
interface PropProps {
  label?: string;      // 悬停显示的标签
  dialogue?: string;   // 点击后说的台词
  style: React.CSSProperties;
  baseImage: string;   // 默认图片
  hoverImage: string;  // 悬停/点击后的图片
  onClick?: () => void;
  isNarrative?: boolean; // 是否为叙事道具 (点击只说话，不打开功能)
}

// --- 通用交互组件 (功能建筑 & 叙事道具) ---
const InteractiveElement: React.FC<PropProps> = ({ 
  label, dialogue, style, baseImage, hoverImage, onClick, isNarrative 
}) => {
  const [isActive, setIsActive] = useState(false); // 用于叙事道具的点击状态
  const [showBubble, setShowBubble] = useState(false);

  const handleClick = () => {
    // 1. 如果有台词，显示气泡
    if (dialogue) {
      setShowBubble(true);
      setIsActive(true);
      // 3秒后气泡消失，状态重置
      setTimeout(() => {
        setShowBubble(false);
        setIsActive(false);
      }, 3000);
    }

    // 2. 执行外部传入的点击逻辑 (比如打开商店)
    if (onClick) onClick();
  };

  return (
    <button 
      onClick={handleClick}
      className="absolute group outline-none"
      style={style}
    >
      {/* A. 默认状态图片 */}
      <img 
        src={baseImage} 
        className={`w-full h-auto object-contain drop-shadow-lg transition-opacity duration-300 absolute inset-0
          ${(isActive && isNarrative) ? 'opacity-0' : 'group-hover:opacity-0'}`}
        alt={label || 'prop'} 
      />
      
      {/* B. 激活状态图片 (悬停 或 点击后) */}
      <img 
        src={hoverImage} 
        className={`w-full h-auto object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] transition-opacity duration-300
          ${(isActive && isNarrative) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
        alt={label || 'prop_active'} 
      />
      
      {/* C. 功能标签 (仅功能建筑显示) */}
      {!isNarrative && label && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0 pointer-events-none z-20">
          <div className="bg-black/80 text-[#f0e6d2] px-3 py-1 font-pixel text-xs border border-[#f0e6d2]/30 tracking-widest shadow-lg whitespace-nowrap">
            {label}
          </div>
          <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-black/80 mx-auto mt-[-1px]"></div>
        </div>
      )}

      {/* D. 叙事气泡 (仅点击后显示) */}
      {showBubble && (
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 z-30 animate-bounce-in">
          <div className="bg-white text-black px-4 py-2 font-pixel text-xs border-2 border-black shadow-[4px_4px_0px_rgba(0,0,0,0.5)] rounded-lg relative whitespace-nowrap">
            {dialogue}
            {/* 气泡小三角 */}
            <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-r-2 border-b-2 border-black transform rotate-45"></div>
          </div>
        </div>
      )}
    </button>
  );
};

export const SlumsScene: React.FC = () => {
  const { 
    setShopOpen, 
    setJobBoardOpen, 
    setHousingOpen, 
    setHospitalOpen, 
    setBankOpen, 
    setFaithOpen,
    setInsuranceOpen 
  } = useGameStore();

  return (
    <BaseScene intensity={1.5}>
      {/* --- Layer 0: 远景天空 --- */}
      <ParallaxLayer depth={0.1}>
        <div className="w-[110vw] h-full bg-[url('/assets/scenes/slums/sky_dusk.jpg')] bg-cover bg-center opacity-60" />
      </ParallaxLayer>

      {/* --- Layer 1: 街道底图 (宽幅) --- */}
      <ParallaxLayer depth={0.4}>
        <div 
          className="w-[120vw] h-full bg-cover bg-center shadow-[inset_0_0_150px_rgba(0,0,0,0.8)]"
          style={{ backgroundImage: "url('/assets/scenes/slums/slums_street_base_panorama.jpg')" }} 
        />
      </ParallaxLayer>

      {/* --- Layer 2: 交互层 (物体布局) --- */}
      <ParallaxLayer depth={0.7} className="z-10">
        <div className="relative w-[120vw] h-full">
          
          {/* ================= 叙事道具 (点击看剧情) ================= */}
          
          {/* 1. 街边瘾君子 (左下角) */}
          <InteractiveElement 
            isNarrative
            dialogue="...呃...有点零钱吗...只要一美元..."
            style={{ left: '5%', bottom: '5%', width: '8vw' }}
            baseImage="/assets/scenes/slums/prop_junkie.png"
            hoverImage="/assets/scenes/slums/prop_junkie_active.png"
          />

          {/* 2. 燃烧的铁桶 (中前景，提供氛围) */}
          <InteractiveElement 
            isNarrative
            dialogue="*噼啪作响的火焰温暖了你的双手*"
            style={{ left: '35%', bottom: '2%', width: '6vw' }}
            baseImage="/assets/scenes/slums/prop_barrel.png"
            hoverImage="/assets/scenes/slums/prop_barrel_fire.png"
          />

          {/* 3. 黑帮放哨人 (右侧阴影处) */}
          <InteractiveElement 
            isNarrative
            dialogue="看什么看？想吃枪子吗？滚远点！"
            style={{ left: '85%', bottom: '15%', width: '7vw' }}
            baseImage="/assets/scenes/slums/prop_gang.png"
            hoverImage="/assets/scenes/slums/prop_gang_threat.png"
          />

          {/* ================= 功能入口 (点击打开UI) ================= */}

          {/* 4. 宗教：街头祭坛 (左侧墙根) */}
          <InteractiveElement 
            label="STREET SHRINE"
            style={{ left: '12%', bottom: '18%', width: '8vw' }}
            baseImage="/assets/scenes/slums/obj_faith_shrine.png"
            hoverImage="/assets/scenes/slums/obj_faith_shrine_lit.png"
            onClick={() => setFaithOpen(true)}
          />

          {/* 5. 商店：黑市轿车 (左中) */}
          <InteractiveElement 
            label="BLACK MARKET"
            style={{ left: '20%', bottom: '10%', width: '20vw' }}
            baseImage="/assets/scenes/slums/obj_shop_car.png"
            hoverImage="/assets/scenes/slums/obj_shop_car_open.png"
            onClick={() => setShopOpen(true)}
          />

          {/* [NEW] 保险入口：公交车站长椅广告 */}
          {/* 放在商店(20%)和工作(45%)之间的空地 */}
          <InteractiveElement 
            label="INJURY LAWYER"
            style={{ left: '32%', bottom: '15%', width: '12vw' }}
            baseImage="/assets/scenes/slums/obj_insurance_bench.png" // 素材：印着夸张广告的长椅
            hoverImage="/assets/scenes/slums/obj_insurance_bench_hover.png"
            onClick={() => setInsuranceOpen(true)}
            dialogue="*广告上写着：受伤了？被捕了？立刻拨打 555-CASH！我们甚至不查你的ID！*"
          />

          {/* 6. 工作：电线杆 (中间) */}
          <InteractiveElement 
            label="JOBS"
            style={{ left: '45%', bottom: '20%', width: '5vw' }}
            baseImage="/assets/scenes/slums/obj_job_pole.png"
            hoverImage="/assets/scenes/slums/obj_job_pole_hover.png"
            onClick={() => setJobBoardOpen(true)}
          />

          {/* 7. 银行：高利贷铺子 (右中) */}
          <InteractiveElement 
            label="LOANS & PAWN"
            style={{ left: '55%', bottom: '18%', width: '12vw' }}
            baseImage="/assets/scenes/slums/obj_bank_loan.png"
            hoverImage="/assets/scenes/slums/obj_bank_loan_neon.png"
            onClick={() => setBankOpen(true)}
          />

          {/* 8. 住房：帐篷 (右前) */}
          <InteractiveElement 
            label="MY SHELTER"
            style={{ left: '70%', bottom: '8%', width: '15vw' }}
            baseImage="/assets/scenes/slums/obj_home_tent.png"
            hoverImage="/assets/scenes/slums/obj_home_tent_open.png"
            onClick={() => setHousingOpen(true)}
          />

           {/* 9. 医院：地下诊所 (最右侧远端) */}
           <InteractiveElement 
            label="CLINIC"
            style={{ left: '92%', bottom: '22%', width: '8vw' }}
            baseImage="/assets/scenes/slums/obj_hospital_door.png"
            hoverImage="/assets/scenes/slums/obj_hospital_door_glow.png"
            onClick={() => setHospitalOpen(true)}
          />

        </div>
      </ParallaxLayer>

      {/* --- Layer 3: 氛围遮罩 --- */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/80 via-transparent to-black/40" />
      <div className="absolute inset-0 pointer-events-none bg-[url('/assets/fx/noise_grain.png')] opacity-10 mix-blend-overlay" />
    </BaseScene>
  );
};