import React from 'react';
import { useI18n } from '@/i18n';
import { RegionID } from '@/types/schema';
import { VehicleShopConfig } from '../config/vehicleShopConfig';
import { LicenseBuySection } from '../sections/LicenseBuySection';
import { DMVQueueSection } from '../sections/DMVQueueSection';

interface LicenseBusinessPanelProps {
  region: RegionID;
  config: VehicleShopConfig;
}

export const LicenseBusinessPanel: React.FC<LicenseBusinessPanelProps> = ({
  region,
  config
}) => {
  const { t } = useI18n();
  
  return (
    <div className="space-y-6">
      {/* 面板标题 */}
      <h3 className="text-lg font-bold text-white/90 border-b border-white/10 pb-2">
        {t(config.rightPanel.titleKey)}
      </h3>

      {/* 动态渲染各区域 */}
      {config.rightPanel.sections.map(section => {
        switch (section) {
          case 'license':
            return (
              <LicenseBuySection 
                key={section}
                region={region}
                uiText={config.uiText}
              />
            );
          case 'dmvQueue':
            // DMV排队（铁锈区特有）
            return (
              <DMVQueueSection 
                key={section}
                uiText={config.uiText}
              />
            );
          case 'eliteLicense':
            // 精英驾照（市区特有）
            return (
              <LicenseBuySection 
                key={section}
                region={region}
                uiText={config.uiText}
                isElite
              />
            );
          default:
            return null;
        }
      })}
    </div>
  );
};
