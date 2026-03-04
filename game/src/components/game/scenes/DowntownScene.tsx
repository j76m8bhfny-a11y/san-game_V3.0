import React, { useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { useI18n } from '@/i18n';
import { RegionID } from '@/types/schema';
import { BaseScene, ParallaxLayer } from './BaseScene';
import { VehicleShopModal } from '../vehicle/VehicleShopModal';

// --- 内部组件：可交互物体 ---
// (如果这个组件在其他场景也用了，建议后续提取到 common 文件夹，这里为了方便直接包含)
interface InteractableProps {
  label: string;
  style: React.CSSProperties;
  baseImage: string;
  hoverImage: string;
  onClick: () => void;
}

const InteractableObject: React.FC<InteractableProps> = ({ label, style, baseImage, hoverImage, onClick }) => {
  return (
    <button 
      onClick={onClick}
      className="absolute group transition-transform duration-500 hover:scale-105 outline-none"
      style={style}
    >
      {/* 默认状态图片 */}
      <img 
        src={baseImage} 
        className="w-full h-full object-contain drop-shadow-2xl group-hover:opacity-0 absolute inset-0 transition-opacity duration-500 ease-in-out" 
        alt={label} 
      />
      
      {/* Hover 状态图片 (发光/动态) */}
      <img 
        src={hoverImage} 
        className="w-full h-full object-contain drop-shadow-[0_0_30px_rgba(255,215,0,0.6)] opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-in-out" 
        alt={label} 
      />
      
      {/* 标签提示 (高级衬线体，黑金配色) */}
      <div className="absolute -top-16 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-4 group-hover:translate-y-0 pointer-events-none z-20">
        <div className="bg-black/90 text-[#d4af37] px-4 py-2 font-serif text-sm border border-[#d4af37]/50 tracking-[0.2em] shadow-[0_4px_20px_rgba(0,0,0,0.5)] uppercase whitespace-nowrap">
          {label}
        </div>
        {/* 装饰性菱形 */}
        <div className="w-2 h-2 bg-[#d4af37] rotate-45 mx-auto mt-[-4px]"></div>
      </div>
    </button>
  );
};

// --- 叙事道具：铜牛 ---
const ChargingBullProp = () => {
  const [isActive, setIsActive] = useState(false);

  const handleClick = () => {
    setIsActive(true);
    // 这里可以播放音效或触发全局 Toast
    console.log("Bull Market Triggered!");
    
    // 3秒后复原
    setTimeout(() => setIsActive(false), 3000);
  };

  return (
    <div 
      onClick={handleClick}
      className={`absolute left-[45%] bottom-[8%] w-[12vw] cursor-pointer transition-all duration-300 ${isActive ? 'scale-110' : 'hover:scale-105'}`}
      style={{ zIndex: 15 }}
    >
      <img 
        src={isActive ? "/assets/scenes/downtown/prop_bull_charging.png" : "/assets/scenes/downtown/prop_bull.png"}
        className="w-full drop-shadow-2xl transition-all duration-300"
        alt="Charging Bull" 
      />
      {/* 喷气特效 (简单的 CSS 动画) */}
      {isActive && (
        <div className="absolute top-1/2 left-0 w-full h-full flex justify-between px-2 pointer-events-none">
           <div className="w-4 h-16 bg-white/40 blur-md animate-ping" style={{ animationDuration: '0.5s' }} />
           <div className="w-4 h-16 bg-white/40 blur-md animate-ping" style={{ animationDuration: '0.6s' }} />
        </div>
      )}
      {/* 点击提示文字 */}
      {isActive && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-black/80 text-green-400 px-3 py-1 rounded font-pixel text-xs whitespace-nowrap border border-green-400">
          {t('scenes.downtown.bull_market')}
        </div>
      )}
    </div>
  );
};

// --- 叙事道具：豪车 ---
const LuxuryCarProp = () => {
  const [isActive, setIsActive] = useState(false);

  const handleClick = () => {
    setIsActive(true);
    setTimeout(() => setIsActive(false), 3000);
  };

  return (
    <div 
      onClick={handleClick}
      className="absolute left-[75%] bottom-[5%] w-[10vw] cursor-pointer transition-all duration-300 hover:scale-105 z-10"
    >
      <img 
        src={isActive ? "/assets/scenes/downtown/prop_luxury_car_lights.png" : "/assets/scenes/downtown/prop_luxury_car.png"}
        className="w-full drop-shadow-2xl"
        alt="Luxury Car" 
      />
      {/* 车灯光效 */}
      {isActive && (
        <div className="absolute top-1/2 left-0 w-full h-full pointer-events-none">
           <div className="absolute top-0 left-1/4 w-8 h-4 bg-white/60 blur-xl" />
           <div className="absolute top-0 right-1/4 w-8 h-4 bg-white/60 blur-xl" />
        </div>
      )}
      {/* 点击提示文字 */}
      {isActive && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-black/80 text-[#d4af37] px-3 py-1 rounded font-pixel text-xs whitespace-nowrap border border-[#d4af37]">
          {t('scenes.downtown.luxury_car')}
        </div>
      )}
    </div>
  );
};

// --- 叙事道具：全息股票板 ---
const HologramStockBoardProp = () => {
  const [isActive, setIsActive] = useState(false);

  const handleClick = () => {
    setIsActive(true);
    setTimeout(() => setIsActive(false), 3000);
  };

  return (
    <div 
      onClick={handleClick}
      className="absolute left-[15%] bottom-[35%] w-[8vw] cursor-pointer transition-all duration-300 hover:scale-105 z-10"
    >
      <img 
        src={isActive ? "/assets/scenes/downtown/prop_hologram_stock_active.png" : "/assets/scenes/downtown/prop_hologram_stock.png"}
        className="w-full drop-shadow-2xl"
        alt="Hologram Stock Board" 
      />
      {/* 全息扫描线效果 */}
      {isActive && (
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
           <div className="absolute w-full h-1 bg-cyan-400/50 blur-sm animate-scan" style={{ animation: 'scan 2s linear infinite' }} />
        </div>
      )}
      {/* 点击提示文字 */}
      {isActive && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-black/80 text-cyan-400 px-3 py-1 rounded font-pixel text-xs whitespace-nowrap border border-cyan-400">
          {t('scenes.downtown.hologram_stock')}
        </div>
      )}
    </div>
  );
};

export const DowntownScene: React.FC = () => {
  const { t } = useI18n();
  const [vehicleShopOpen, setVehicleShopOpen] = useState(false);
  const { 
    setShopOpen, 
    setJobBoardOpen, 
    setHousingOpen, 
    setHospitalOpen, 
    setBankOpen,
    setInsuranceOpen,
    setFaithOpen
  } = useGameStore();

  return (
    <>
    {/* 强度 0.6：体现核心区的稳重与压迫感，视差不宜过大 */}
    <BaseScene intensity={0.6} className="bg-[#050510]"> 
      
      {/* --- Layer 0: 璀璨天际线 (极慢) --- */}
      <ParallaxLayer depth={0.05}>
        <div className="w-[110vw] h-full bg-[url('/assets/scenes/downtown/sky_night.jpg')] bg-cover bg-center opacity-100" />
        {/* 动态探照灯效果 */}
        <div className="absolute top-[-20%] left-[20%] w-[10vw] h-[150vh] bg-gradient-to-b from-white/20 to-transparent rotate-[25deg] animate-pulse blur-2xl origin-top" style={{ animationDuration: '4s' }} />
        <div className="absolute top-[-20%] right-[30%] w-[8vw] h-[150vh] bg-gradient-to-b from-blue-500/10 to-transparent rotate-[-15deg] animate-pulse blur-2xl origin-top" style={{ animationDuration: '7s' }} />
      </ParallaxLayer>

      {/* --- Layer 1: 金融街底图 --- */}
      <ParallaxLayer depth={0.25}>
        <div 
          className="w-[115vw] h-full bg-cover bg-center shadow-[inset_0_0_100px_rgba(0,0,0,0.5)]"
          style={{ backgroundImage: "url('/assets/scenes/downtown/street_base.jpg')" }} 
        />
      </ParallaxLayer>

      {/* --- Layer 2: 交互层 (权力机构) --- */}
      <ParallaxLayer depth={0.55} className="z-10">
        <div className="relative w-[115vw] h-full">
          
          {/* 1. 私人俱乐部 (商店) - 左侧 */}
          <InteractableObject 
            label={t('scenes.downtown.the_club')}
            style={{ left: '10%', bottom: '15%', width: '18vw' }}
            baseImage="/assets/scenes/downtown/obj_shop_club.png"
            hoverImage="/assets/scenes/downtown/obj_shop_club_lit.png"
            onClick={() => setShopOpen(true)}
          />

          {/* 2. 总部大厦 (工作) - 左中 */}
          <InteractableObject 
            label={t('scenes.downtown.global_hq')}
            style={{ left: '28%', bottom: '12%', width: '16vw' }}
            baseImage="/assets/scenes/downtown/obj_job_hq.png"
            hoverImage="/assets/scenes/downtown/obj_job_hq_lit.png"
            onClick={() => setJobBoardOpen(true)}
          />

          {/* 3. 叙事道具：华尔街铜牛 - 中间 */}
          <ChargingBullProp />
          
          {/* 4. 叙事道具：豪车 - 右侧路边 */}
          <LuxuryCarProp />
          
          {/* 5. 叙事道具：全息股票板 - 左侧高楼旁 */}
          <HologramStockBoardProp />

          {/* 4. 顶层公寓入口 (住房) - 右中 */}
          <InteractableObject 
            label={t('scenes.downtown.the_penthouse')}
            style={{ left: '62%', bottom: '14%', width: '20vw' }}
            baseImage="/assets/scenes/downtown/obj_housing_penthouse.png"
            hoverImage="/assets/scenes/downtown/obj_housing_penthouse_lit.png"
            onClick={() => setHousingOpen(true)}
          />

          {/* 5. 私人银行 (银行) - 右侧 */}
          <InteractableObject 
            label={t('scenes.downtown.private_vault')}
            style={{ left: '80%', bottom: '16%', width: '18vw' }}
            baseImage="/assets/scenes/downtown/obj_bank_vault.png"
            hoverImage="/assets/scenes/downtown/obj_bank_vault_open.png"
            onClick={() => setBankOpen(true)}
          />

          {/* [NEW] 车辆商店：豪车展厅 */}
          <InteractableObject 
            label={t('vehicleShop.downtown.name')}
            style={{ left: '90%', bottom: '12%', width: '10vw' }}
            baseImage="/assets/scenes/downtown/obj_vehicle_showroom.png"
            hoverImage="/assets/scenes/downtown/obj_vehicle_showroom_hover.png"
            onClick={() => setVehicleShopOpen(true)}
          />
          
          {/* 6. 生命延续中心 (医院) - 最右 */}
           <InteractableObject 
            label={t('scenes.downtown.bio_lab')}
            style={{ left: '95%', bottom: '20%', width: '12vw' }}
            baseImage="/assets/scenes/downtown/obj_hospital_lab.png"
            hoverImage="/assets/scenes/downtown/obj_hospital_lab_lit.png"
            onClick={() => setHospitalOpen(true)}
          />

          {/* [NEW] 保险入口：风险精算所 */}
          <InteractableObject 
            label={t('scenes.downtown.actuarial_institute')}
            style={{ left: '55%', bottom: '12%', width: '10vw' }}
            baseImage="/assets/scenes/downtown/obj_insurance_actuarial.png"
            hoverImage="/assets/scenes/downtown/obj_insurance_actuarial_lit.png"
            onClick={() => setInsuranceOpen(true)}
          />
          
          {/* 7. 信仰：共济会/现代商业教会 */}
          <InteractableObject 
            label={t('scenes.downtown.masonic_lodge')}
            style={{ left: '5%', bottom: '40%', width: '8vw' }}
            baseImage="/assets/scenes/downtown/obj_faith_lodge.png"
            hoverImage="/assets/scenes/downtown/obj_faith_lodge_lit.png"
            onClick={() => setFaithOpen(true)}
          />

        </div>
      </ParallaxLayer>

      {/* --- Layer 3: 氛围滤镜 --- */}
      
      {/* 蓝色冷调叠加 (Blue Hour) */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-[#001020]/50 via-transparent to-[#100500]/40 mix-blend-overlay" />
      
      {/* 底部金色反光 (模拟湿漉漉的街道反射霓虹灯) */}
      <div className="absolute bottom-0 left-0 w-full h-[30%] bg-gradient-to-t from-[#d4af37]/10 to-transparent mix-blend-screen pointer-events-none" />
      
      {/* 细微的科幻/全息网格线 (极淡，体现高端感) */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:100px_100px] pointer-events-none opacity-20" />

      {/* 内联动画样式 */}
      <style>{`
        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(1000%); }
        }
      `}</style>

    </BaseScene>

    {/* 车辆商店弹窗 */}
    {vehicleShopOpen && (
      <VehicleShopModal 
        region={RegionID.Downtown}
        onClose={() => setVehicleShopOpen(false)} 
      />
    )}
  </>);
};