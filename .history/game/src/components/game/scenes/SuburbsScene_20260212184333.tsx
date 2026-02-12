import React, { useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { BaseScene, ParallaxLayer } from './BaseScene';

// --- 内部组件：可交互物体 (带标签和光效) ---
interface InteractableProps {
  label: string;
  style: React.CSSProperties;
  baseImage: string;
  hoverImage: string;
  onClick: () => void;
}

const InteractableObject: React.FC<InteractableProps> = ({ 
  label, 
  style, 
  baseImage, 
  hoverImage, 
  onClick 
}) => {
  return (
    <button 
      onClick={onClick}
      className="absolute group outline-none transition-transform duration-500 ease-out hover:scale-105"
      style={style}
    >
      {/* 1. 阴影 (模拟地面投影) */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-[10%] bg-black/40 blur-md rounded-full" />

      {/* 2. 基础图片 */}
      <img 
        src={baseImage} 
        className="relative w-full h-auto object-contain transition-opacity duration-300 group-hover:opacity-0" 
        alt={label} 
      />
      
      {/* 3. 悬停图片 (高亮/开门状态) */}
      <img 
        src={hoverImage} 
        className="absolute inset-0 w-full h-auto object-contain opacity-0 transition-opacity duration-300 group-hover:opacity-100" 
        alt={label} 
      />

      {/* 4. 标签 (中产阶级风格：干净、极简、白色无衬线) */}
      <div className="absolute -top-16 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0 pointer-events-none z-20">
        <div className="bg-white/90 text-gray-800 px-4 py-2 font-sans font-bold text-xs tracking-widest shadow-xl border border-gray-200 rounded-sm uppercase whitespace-nowrap">
          {label}
        </div>
        {/* 倒三角箭头 */}
        <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-white/90 mx-auto"></div>
      </div>
    </button>
  );
};

// --- 内部组件：叙事道具 (点击触发文字气泡) ---
const NarrativeProp: React.FC<{
  image: string;
  style: React.CSSProperties;
  message: string;
}> = ({ image, style, message }) => {
  const [active, setActive] = useState(false);

  const handleClick = () => {
    setActive(true);
    setTimeout(() => setActive(false), 3000); // 3秒后消失
  };

  return (
    <div 
      className="absolute cursor-pointer transition-transform hover:scale-110 active:scale-95"
      style={style}
      onClick={handleClick}
    >
      <img src={image} className="w-full drop-shadow-md" alt="prop" />
      
      {/* 气泡对话框 */}
      {active && (
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 bg-[#2a2a2a] text-white text-xs p-3 rounded-lg shadow-2xl min-w-[150px] text-center z-50 animate-bounce-in">
          {message}
          <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-[#2a2a2a] rotate-45"></div>
        </div>
      )}
    </div>
  );
};

// --- 主场景组件 ---
export const SuburbsScene: React.FC = () => {
  const { 
    setShopOpen, 
    setJobBoardOpen, 
    setHousingOpen, 
    setHospitalOpen, 
    setBankOpen 
  } = useGameStore();

  return (
    <BaseScene intensity={0.8} className="bg-[#87CEEB]"> {/* 天空蓝背景底色 */}
      
      {/* ================= Layer 0: 完美天空 (极慢) ================= */}
      <ParallaxLayer depth={0.05}>
        <div className="w-[110vw] h-full bg-[url('/assets/scenes/suburbs/sky_sunny.jpg')] bg-cover bg-center opacity-100" />
        {/* 增加一点云彩缓慢飘动的动画 */}
        <div className="absolute inset-0 bg-[url('/assets/fx/clouds_overlay.png')] opacity-30 animate-pulse-slow mix-blend-screen" />
      </ParallaxLayer>

      {/* ================= Layer 1: 街道底图 (中速) ================= */}
      <ParallaxLayer depth={0.3}>
        <div 
          className="w-[120vw] h-full bg-cover bg-center shadow-lg"
          style={{ backgroundImage: "url('/assets/scenes/suburbs/street_base.jpg')" }} 
        />
      </ParallaxLayer>

      {/* ================= Layer 2: 交互设施 (快速) ================= */}
      <ParallaxLayer depth={0.6} className="z-10">
        <div className="relative w-[120vw] h-full">
          
          {/* 1. 商店：有机食品超市 (左侧) */}
          <InteractableObject 
            label="WHOLE FOODS MARKET"
            style={{ left: '5%', bottom: '16%', width: '24vw' }}
            baseImage="/assets/scenes/suburbs/obj_shop_market.png"
            hoverImage="/assets/scenes/suburbs/obj_shop_market_lit.png"
            onClick={() => setShopOpen(true)}
          />

          {/* 2. 工作：办公园区 (左中) */}
          <InteractableObject 
            label="CORPORATE PARK"
            style={{ left: '26%', bottom: '20%', width: '16vw' }}
            baseImage="/assets/scenes/suburbs/obj_job_office.png"
            hoverImage="/assets/scenes/suburbs/obj_job_office_lit.png"
            onClick={() => setJobBoardOpen(true)}
          />

          {/* 道具：HOA 警告牌 (草坪上) */}
          <NarrativeProp 
            image="/assets/scenes/suburbs/prop_hoa_sign.png"
            style={{ left: '44%', bottom: '12%', width: '3vw' }}
            message="HOA REMINDER: Your grass is 0.5 inches too tall."
          />

          {/* 3. 住房：独栋别墅 (正中) */}
          <InteractableObject 
            label="MY HOUSE"
            style={{ left: '50%', bottom: '18%', width: '28vw' }}
            baseImage="/assets/scenes/suburbs/obj_housing_house.png"
            hoverImage="/assets/scenes/suburbs/obj_housing_house_open.png"
            onClick={() => setHousingOpen(true)}
          />

          {/* 道具：堆积的快递 (家门口) */}
          <NarrativeProp 
            image="/assets/scenes/suburbs/prop_packages.png"
            style={{ left: '62%', bottom: '19%', width: '5vw', zIndex: 20 }}
            message="Amazon: Payment Declined. Please update your card."
          />

          {/* 4. 银行：商业银行 (右中) */}
          <InteractableObject 
            label="CHASE BANK"
            style={{ left: '76%', bottom: '17%', width: '14vw' }}
            baseImage="/assets/scenes/suburbs/obj_bank_branch.png"
            hoverImage="/assets/scenes/suburbs/obj_bank_branch_lit.png"
            onClick={() => setBankOpen(true)}
          />

          {/* 5. 医院：连锁药房 (右侧) */}
           <InteractableObject 
            label="CVS PHARMACY"
            style={{ left: '88%', bottom: '15%', width: '18vw' }}
            baseImage="/assets/scenes/suburbs/obj_hospital_pharmacy.png"
            hoverImage="/assets/scenes/suburbs/obj_hospital_pharmacy_lit.png"
            onClick={() => setHospitalOpen(true)}
          />

          {/* [NEW] 保险入口：保险经纪人立牌 */}
          {/* 放在办公区(26%)和HOA牌子(44%)之间 */}
          <InteractableObject 
            label="SAFEHANDS AGENT"
            style={{ left: '36%', bottom: '14%', width: '4vw' }}
            baseImage="/assets/scenes/suburbs/obj_insurance_sign.png" // 素材：类似房地产广告的小立牌
            hoverImage="/assets/scenes/suburbs/obj_insurance_sign_hover.png"
            onClick={() => useGameStore.getState().setInsuranceOpen(true)}
          />
          
          {/* 增加一点中产阶级的讽刺细节 */}
          <NarrativeProp 
            image="/assets/scenes/suburbs/prop_flyer_pile.png"
            style={{ left: '38%', bottom: '13%', width: '2vw' }}
            message="Don't wait for disaster! Bundle your life today!"
          />

        </div>
      </ParallaxLayer>

      {/* ================= Layer 3: 氛围特效 ================= */}
      
      {/* 阳光光晕 (Lens Flare) - 营造虚假的完美感 */}
      <div className="absolute -top-20 -right-20 w-[60vw] h-[60vw] bg-[radial-gradient(circle,rgba(255,255,255,0.4)_0%,rgba(255,255,200,0.1)_40%,transparent_70%)] pointer-events-none mix-blend-screen animate-pulse-slow" />
      
      {/* 淡淡的晕影，不像贫民窟那么黑，这里是白色的柔光晕影 */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_50%,rgba(255,255,255,0.3)_100%)] mix-blend-soft-light" />

    </BaseScene>
  );
};