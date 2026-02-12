import React, { useMemo } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { REGION_THEME_MAP, THEME_ANIMATIONS } from '@/config/insuranceUIConfig';
import { SlumsInsuranceFlyer } from './insurance/SlumsInsuranceFlyer';
import { RustBeltInsuranceForm } from './insurance/RustBeltInsuranceForm';
import { SuburbsInsuranceEnroll } from './insurance/SuburbsInsuranceEnroll';
import { DowntownInsuranceApp } from './insurance/DowntownInsuranceApp';
import { CapitalistInsuranceCard } from './insurance/CapitalistInsuranceCard';


interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const InsuranceModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { currentRegion, vitality } = useGameStore();
  
  // 1. 确定主题
  const theme = REGION_THEME_MAP[currentRegion] || 'SLUMS';
  
  // 特殊判断：如果是资本家阶级，无论在哪都显示高级卡片 (可选逻辑)
  // const isCapitalist = vitality.identity.currentClass === 'CAPITALIST';
  // const finalTheme = isCapitalist ? 'GLOBAL' : theme; 
  const finalTheme = theme; 

  if (!isOpen) return null;

  // 2. 渲染对应组件
  const renderContent = () => {
    switch (finalTheme) {
      case 'SLUMS':
        return <SlumsInsuranceFlyer onClose={onClose} />;
      case 'RUST_BELT':
        return <RustBeltInsuranceForm onClose={onClose} />;
      case 'SUBURBS':
        return <SuburbsInsuranceEnroll onClose={onClose} />;
      case 'DOWNTOWN':
        return <DowntownInsuranceApp onClose={onClose} />;
      case 'GLOBAL':
        return <CapitalistInsuranceCard onClose={onClose} />;
      default:
        return <SlumsInsuranceFlyer onClose={onClose} />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-[2px]">
      {/* 隐形关闭层 */}
      <div className="absolute inset-0" onClick={onClose} />
      
      {/* 动态容器 */}
      <div className={`relative z-10 w-full max-w-4xl flex justify-center ${THEME_ANIMATIONS[finalTheme]}`}>
        {renderContent()}
      </div>
    </div>
  );
};