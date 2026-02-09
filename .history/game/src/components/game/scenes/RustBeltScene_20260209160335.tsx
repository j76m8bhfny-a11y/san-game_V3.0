import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { BaseScene, ParallaxLayer } from './BaseScene';

// 复用之前的 InteractableObject 组件...

export const RustBeltScene: React.FC = () => {
  const { setShopOpen, setJobBoardOpen, setHousingOpen, setHospitalOpen, setBankOpen } = useGameStore();

  return (
    <BaseScene intensity={1.0}> {/* 工业区移动稍微稳重一点 */}
      
      {/* Layer 0: 远景工厂 (极慢) */}
      <ParallaxLayer depth={0.05}>
        <div className="w-[110vw] h-full bg-[url('/assets/scenes/rust/sky_overcast.jpg')] bg-cover bg-center opacity-80" />
      </ParallaxLayer>

      {/* Layer 1: 工业大道底图 */}
      <ParallaxLayer depth={0.4}>
        <div 
          className="w-[125vw] h-full bg-cover bg-center"
          style={{ backgroundImage: "url('/assets/scenes/rust/street_base.jpg')" }} 
        />
      </ParallaxLayer>

      {/* Layer 2: 交互层 */}
      <ParallaxLayer depth={0.7} className="z-10">
        <div className="relative w-[125vw] h-full">
          
          {/* 左侧：加油站 (商店) */}
          <InteractableObject 
            label="CONVENIENCE STORE"
            style={{ left: '10%', bottom: '15%', width: '25vw' }}
            baseImage="/assets/scenes/rust/obj_shop_gas.png"
            hoverImage="/assets/scenes/rust/obj_shop_gas_lit.png"
            onClick={() => setShopOpen(true)}
          />

          {/* 左中：紧急护理 (医院) */}
          <InteractableObject 
            label="URGENT CARE"
            style={{ left: '30%', bottom: '18%', width: '15vw' }}
            baseImage="/assets/scenes/rust/obj_hospital_care.png"
            hoverImage="/assets/scenes/rust/obj_hospital_care_lit.png"
            onClick={() => setHospitalOpen(true)}
          />

          {/* 右中：工厂大门 (工作) */}
          <InteractableObject 
            label="FACTORY GATE"
            style={{ left: '55%', bottom: '20%', width: '12vw' }}
            baseImage="/assets/scenes/rust/obj_job_gate.png"
            hoverImage="/assets/scenes/rust/obj_job_gate_lit.png"
            onClick={() => setJobBoardOpen(true)}
          />

          {/* 右侧：支票兑现 (银行) */}
          <InteractableObject 
            label="CHECK CASHING"
            style={{ left: '70%', bottom: '16%', width: '15vw' }}
            baseImage="/assets/scenes/rust/obj_bank_check.png"
            hoverImage="/assets/scenes/rust/obj_bank_check_lit.png"
            onClick={() => setBankOpen(true)}
          />

          {/* 最右：汽车旅馆 (住房) */}
          <InteractableObject 
            label="MOTEL 6"
            style={{ left: '88%', bottom: '12%', width: '20vw' }}
            baseImage="/assets/scenes/rust/obj_housing_motel.png"
            hoverImage="/assets/scenes/rust/obj_housing_motel_lit.png"
            onClick={() => setHousingOpen(true)}
          />

        </div>
      </ParallaxLayer>

      {/* Layer 3: 前景特效 (烟雾/灰尘) */}
      <div className="absolute inset-0 pointer-events-none bg-[url('/assets/fx/smog_overlay.png')] opacity-30 mix-blend-screen animate-pulse" />
    </BaseScene>
  );
};