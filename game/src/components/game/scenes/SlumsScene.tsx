import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { BaseScene, ParallaxLayer } from './BaseScene';

export const SlumsScene: React.FC = () => {
  const { setShopOpen, setJobBoardOpen, setHousingOpen, setHospitalOpen, setBankOpen } = useGameStore();

  return (
    <BaseScene intensity={1.5}>
      {/* --- Layer 0: 远景天空 (几乎不动) --- */}
      <ParallaxLayer depth={0.1}>
        <div className="w-[110vw] h-full bg-[url('/assets/scenes/slums/sky_dusk.jpg')] bg-cover bg-center opacity-50" />
      </ParallaxLayer>

      {/* --- Layer 1: 街道底图 (宽幅移动) --- */}
      <ParallaxLayer depth={0.5}>
        <div 
          className="w-[120vw] h-full bg-cover bg-center shadow-[inset_0_0_100px_rgba(0,0,0,0.8)]"
          style={{ backgroundImage: "url('/assets/scenes/slums/street_base.jpg')" }} 
        >
          {/* 这里可以放一些纯装饰性的动态元素，比如远处冒烟的桶 */}
          <div className="absolute left-[20%] bottom-[30%] w-20 h-20 bg-orange-500/20 blur-[40px] animate-pulse" />
        </div>
      </ParallaxLayer>

      {/* --- Layer 2: 交互层 (前景物体) --- */}
      {/* 这一层的物体是“贴”在画面上的，需要 PNG 透明图 */}
      <ParallaxLayer depth={0.8} className="z-10">
        <div className="relative w-[120vw] h-full">
          
          {/* 1. 商店 (黑市轿车) - 左侧 */}
          <InteractableObject 
            label="BLACK MARKET"
            style={{ left: '15%', bottom: '10%', width: '25vw' }}
            baseImage="/assets/scenes/slums/obj_shop_car.png"
            hoverImage="/assets/scenes/slums/obj_shop_car_open.png"
            onClick={() => setShopOpen(true)}
          />

          {/* 2. 工作 (电线杆) - 中左 */}
          <InteractableObject 
            label="JOBS"
            style={{ left: '38%', bottom: '20%', width: '8vw' }}
            baseImage="/assets/scenes/slums/obj_job_pole.png"
            hoverImage="/assets/scenes/slums/obj_job_pole_hover.png"
            onClick={() => setJobBoardOpen(true)}
          />

          {/* 3. 住房 (帐篷) - 右侧 */}
          <InteractableObject 
            label="SHELTER"
            style={{ left: '65%', bottom: '12%', width: '20vw' }}
            baseImage="/assets/scenes/slums/obj_home_tent.png"
            hoverImage="/assets/scenes/slums/obj_home_tent_open.png"
            onClick={() => setHousingOpen(true)}
          />

           {/* 4. 医院 (地下诊所入口) - 远端右侧 */}
           <InteractableObject 
            label="CLINIC"
            style={{ left: '85%', bottom: '25%', width: '12vw' }}
            baseImage="/assets/scenes/slums/obj_hospital_door.png"
            hoverImage="/assets/scenes/slums/obj_hospital_door_glow.png"
            onClick={() => setHospitalOpen(true)}
          />
        </div>
      </ParallaxLayer>

      {/* --- Layer 3: 前景遮挡 (如雨水、飞舞的垃圾) --- */}
      <div className="absolute inset-0 pointer-events-none bg-[url('/assets/fx/noise_grain.png')] opacity-10 mix-blend-overlay" />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/80 via-transparent to-black/40" />
    </BaseScene>
  );
};

// 内部小组件：处理 Hover 切换图片
const InteractableObject = ({ label, style, baseImage, hoverImage, onClick }: any) => {
  return (
    <button 
      onClick={onClick}
      className="absolute group transition-transform duration-300 hover:scale-105 outline-none"
      style={style}
    >
      {/* 默认状态图片 */}
      <img src={baseImage} className="w-full h-auto object-contain drop-shadow-xl group-hover:opacity-0 absolute inset-0 transition-opacity" alt={label} />
      
      {/* Hover 状态图片 (预加载) */}
      <img src={hoverImage} className="w-full h-auto object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] opacity-0 group-hover:opacity-100 transition-opacity" alt={label} />
      
      {/* 标签提示 */}
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
        <span className="bg-black/80 text-white px-3 py-1 font-pixel text-xs border border-white/20 tracking-widest">
          {label}
        </span>
      </div>
    </button>
  );
};