// src/components/game/scenes/RustBeltScene.tsx
import React, { useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { useI18n } from '@/i18n';
import { BaseScene, ParallaxLayer } from './BaseScene';

// --- 辅助组件：交互物体 (功能入口) ---
interface InteractableObjectProps {
  label: string;
  style: React.CSSProperties;
  baseImage: string;
  hoverImage: string;
  onClick: () => void;
}

const InteractableObject: React.FC<InteractableObjectProps> = ({ label, style, baseImage, hoverImage, onClick }) => {
  return (
    <button 
      onClick={onClick}
      className="absolute group transition-transform duration-300 hover:scale-105 outline-none z-20"
      style={style}
    >
      {/* 默认状态图片 */}
      <img 
        src={baseImage} 
        className="w-full h-auto object-contain drop-shadow-xl group-hover:opacity-0 absolute inset-0 transition-opacity duration-300" 
        alt={label} 
      />
      
      {/* Hover 状态图片 (发光/动态) */}
      <img 
        src={hoverImage} 
        className="w-full h-auto object-contain drop-shadow-[0_0_20px_rgba(255,165,0,0.6)] opacity-0 group-hover:opacity-100 transition-opacity duration-300" 
        alt={label} 
      />
      
      {/* 标签提示 (工业风格: 黑黄配色) */}
      <div className="absolute -top-14 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0 pointer-events-none">
        <div className="bg-[#2a2a2a] text-[#ffd700] px-2 py-1 font-pixel text-xs border-2 border-[#ffd700] tracking-widest shadow-lg uppercase whitespace-nowrap">
          {label}
        </div>
        {/* 连接线 */}
        <div className="w-[2px] h-4 bg-[#ffd700] mx-auto"></div>
      </div>
    </button>
  );
};

// --- 辅助组件：叙事道具 (点击触发剧情气泡) ---
interface NarrativePropProps {
  text: string;
  style: React.CSSProperties;
  baseImage: string;
  activeImage?: string; // 点击后的图片（可选）
}

const NarrativeProp: React.FC<NarrativePropProps> = ({ text, style, baseImage, activeImage }) => {
  const [isActive, setIsActive] = useState(false);

  const handleClick = () => {
    if (isActive) return;
    setIsActive(true);
    
    // 这里未来可以添加音效调用，例如: playSound('click_prop');

    // 4秒后自动重置状态
    setTimeout(() => setIsActive(false), 4000);
  };

  return (
    <div 
      className="absolute cursor-pointer group z-10" 
      style={style}
      onClick={handleClick}
    >
      <div className={`relative w-full h-full transition-transform duration-200 ${isActive ? 'scale-105' : 'group-hover:scale-102'}`}>
        <img 
          src={isActive && activeImage ? activeImage : baseImage} 
          className="w-full h-auto object-contain drop-shadow-lg"
          alt="Narrative Prop" 
        />
        
        {/* 漫画风格对话气泡 */}
        <div className={`
          absolute -top-24 left-1/2 -translate-x-1/2 w-48 z-30
          bg-white text-black p-3 rounded-lg font-pixel text-xs border-2 border-black shadow-[4px_4px_0px_rgba(0,0,0,0.5)]
          transition-all duration-300 origin-bottom
          ${isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-50 pointer-events-none'}
        `}>
          <p className="leading-tight font-bold">“{text}”</p>
          {/* 气泡小三角 */}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-t-8 border-t-black"></div>
          <div className="absolute -bottom-[5px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-white"></div>
        </div>
      </div>
    </div>
  );
};

export const RustBeltScene: React.FC = () => {
  const { t } = useI18n();
  const { setShopOpen, setJobBoardOpen, setHousingOpen, setHospitalOpen, setBankOpen, setInsuranceOpen } = useGameStore();

  return (
    <BaseScene intensity={0.8} className="bg-[#1a1a1a]">
      {/* --- Layer 0: 远景天空 (工业烟雾) --- */}
      <ParallaxLayer depth={0.05}>
        <div className="w-[110vw] h-full bg-[url('/assets/scenes/rust/sky_overcast.jpg')] bg-cover bg-center opacity-90" />
      </ParallaxLayer>

      {/* --- Layer 1: 远景工厂轮廓 (增强纵深感) --- */}
      {/* 如果没有专门的工厂轮廓图，可以暂时省略或复用天空图调整位置 */}
      <ParallaxLayer depth={0.15}>
         <div className="w-[115vw] h-full bg-[url('/assets/scenes/rust/sky_overcast.jpg')] bg-cover bg-bottom opacity-50 mix-blend-multiply brightness-50" />
      </ParallaxLayer>

      {/* --- Layer 2: 街道底图 (宽幅) --- */}
      <ParallaxLayer depth={0.4}>
        <div 
          className="w-[125vw] h-full bg-cover bg-center shadow-[inset_0_0_150px_rgba(0,0,0,0.8)]"
          style={{ backgroundImage: "url('/assets/scenes/rust/street_base.jpg')" }} 
        />
      </ParallaxLayer>

      {/* --- Layer 3: 交互层 (物体) --- */}
      {/* 布局策略 (Rust Belt):
         工业区的建筑比贫民窟更庞大、间距更宽。
         左侧: 商业区 (加油站, 医院)
         中右侧: 工业/居住区 (工厂, 汽车旅馆)
      */}
      <ParallaxLayer depth={0.65}>
        <div className="relative w-[125vw] h-full">
          
          {/* 1. 叙事道具：抛锚的皮卡 (左侧路边) */}
          <NarrativeProp 
             text={t('scenes.rust_belt.truck_text')}
             style={{ left: '5%', bottom: '12%', width: '18vw' }}
             baseImage="/assets/scenes/rust/prop_broken_truck.png"
             activeImage="/assets/scenes/rust/prop_broken_truck_smoke.png"
          />

          {/* 2. 商店：加油站便利店 */}
          <InteractableObject 
            label="GAS & MART"
            style={{ left: '20%', bottom: '18%', width: '22vw' }}
            baseImage="/assets/scenes/rust/obj_shop_gas.png"
            hoverImage="/assets/scenes/rust/obj_shop_gas_lit.png"
            onClick={() => setShopOpen(true)}
          />

          {/* 3. 医院：紧急护理中心 */}
          <InteractableObject 
            label="URGENT CARE"
            style={{ left: '38%', bottom: '22%', width: '14vw' }}
            baseImage="/assets/scenes/rust/obj_hospital_care.png"
            hoverImage="/assets/scenes/rust/obj_hospital_care_lit.png"
            onClick={() => setHospitalOpen(true)}
          />

          {/* 4. 叙事道具：罢工标语 (路中间) */}
          <NarrativeProp 
             text={t('scenes.rust_belt.strike_text')}
             style={{ left: '50%', bottom: '8%', width: '6vw' }}
             baseImage="/assets/scenes/rust/prop_strike_sign.png"
             activeImage="/assets/scenes/rust/prop_strike_sign_fallen.png"
          />

          {/* 5. 工作：工厂大门 */}
          <InteractableObject 
            label="STEEL WORKS"
            style={{ left: '58%', bottom: '25%', width: '15vw' }}
            baseImage="/assets/scenes/rust/obj_job_gate.png"
            hoverImage="/assets/scenes/rust/obj_job_gate_lit.png"
            onClick={() => setJobBoardOpen(true)}
          />

          {/* 6. 银行：支票兑现 */}
          <InteractableObject 
            label="CHECK CASHING"
            style={{ left: '72%', bottom: '20%', width: '14vw' }}
            baseImage="/assets/scenes/rust/obj_bank_check.png"
            hoverImage="/assets/scenes/rust/obj_bank_check_lit.png"
            onClick={() => setBankOpen(true)}
          />

          {/* 7. 住房：汽车旅馆 */}
          <InteractableObject 
            label="MOTEL 6"
            style={{ left: '85%', bottom: '15%', width: '18vw' }}
            baseImage="/assets/scenes/rust/obj_housing_motel.png"
            hoverImage="/assets/scenes/rust/obj_housing_motel_lit.png"
            onClick={() => setHousingOpen(true)}
          />
          
          {/* 8. 叙事道具：野狗 (最右侧) */}
          <NarrativeProp 
             text={t('scenes.rust_belt.dog_text')}
             style={{ left: '92%', bottom: '10%', width: '6vw' }}
             baseImage="/assets/scenes/rust/prop_stray_dog.png"
          />
          {/* [NEW] 保险入口：工会登记处 (折叠桌) */}
          {/* 放在工作(58%)和银行(72%)之间 */}
          <InteractableObject 
            label="UNION REP"
            style={{ left: '66%', bottom: '20%', width: '8vw' }}
            baseImage="/assets/scenes/rust/obj_insurance_table.png" // 素材：一张放满文件的折叠桌和一把椅子
            hoverImage="/assets/scenes/rust/obj_insurance_table_lit.png"
            onClick={() => setInsuranceOpen(true)}
          />
          
          {/* 配合一个正在喝咖啡的工会代表(装饰) */}
          <NarrativeProp 
             text={t('scenes.rust_belt.union_rep_text')}
             style={{ left: '68%', bottom: '26%', width: '3vw', zIndex: 21 }}
             baseImage="/assets/scenes/rust/prop_coffee_cup.png"
          />

        </div>
      </ParallaxLayer>

      {/* --- Layer 4: 前景氛围 (烟雾/灰尘) --- */}
      <div className="absolute inset-0 pointer-events-none mix-blend-screen opacity-40 overflow-hidden">
        {/* 模拟飘动的工业烟雾 */}
        <div className="absolute top-0 left-0 w-[200%] h-full bg-[url('/assets/fx/smog_overlay.png')] animate-drift-slow" />
      </div>

      {/* --- Layer 5: 全局滤镜 (铁锈色调) --- */}
      <div className="absolute inset-0 pointer-events-none bg-[#3b2d1d] mix-blend-overlay opacity-30" />
      <div className="absolute inset-0 pointer-events-none bg-[url('/assets/fx/noise_grain.png')] opacity-10" />

      {/* 内联样式：简单的漂移动画 */}
      <style>{`
        @keyframes drift-slow {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-drift-slow {
          animation: drift-slow 60s linear infinite;
        }
      `}</style>
    </BaseScene>
  );
};