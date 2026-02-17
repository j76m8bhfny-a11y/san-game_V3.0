import React from 'react';
import { useI18n } from '@/i18n';
import { RegionID } from '@/types/schema';
import { VehicleShopConfig } from '../config/vehicleShopConfig';
import { VehicleBuySection } from '../sections/VehicleBuySection';
import { VehicleSellSection } from '../sections/VehicleSellSection';

interface VehicleBusinessPanelProps {
  region: RegionID;
  config: VehicleShopConfig;
}

export const VehicleBusinessPanel: React.FC<VehicleBusinessPanelProps> = ({
  region,
  config
}) => {
  const { t } = useI18n();
  
  return (
    <div className="space-y-6">
      {/* 面板标题 */}
      <h3 className="text-lg font-bold text-white/90 border-b border-white/10 pb-2">
        {t(config.leftPanel.titleKey)}
      </h3>

      {/* 动态渲染各区域 */}
      {config.leftPanel.sections.map(section => {
        switch (section) {
          case 'buy':
            return (
              <VehicleBuySection 
                key={section}
                region={region}
                uiText={config.uiText}
                features={config.features}
              />
            );
          case 'sell':
            return (
              <VehicleSellSection 
                key={section}
                region={region}
                uiText={config.uiText}
              />
            );
          case 'tradeIn':
            // 置换功能（郊区特有）
            return config.features?.tradeInEnabled ? (
              <VehicleSellSection 
                key={section}
                region={region}
                uiText={config.uiText}
                isTradeIn
              />
            ) : null;
          default:
            return null;
        }
      })}
    </div>
  );
};
