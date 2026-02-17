import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '@/i18n';
import { RegionID } from '@/types/schema';
import { getVehicleShopConfig } from './config/vehicleShopConfig';
import { VehicleBusinessPanel } from './panels/VehicleBusinessPanel';
import { LicenseBusinessPanel } from './panels/LicenseBusinessPanel';
import { X } from 'lucide-react';

interface VehicleShopModalProps {
  region: RegionID;
  onClose: () => void;
}

export const VehicleShopModal: React.FC<VehicleShopModalProps> = ({
  region,
  onClose
}) => {
  const { t } = useI18n();
  const config = getVehicleShopConfig(region);
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[7000] flex items-center justify-center bg-black/80 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-lg shadow-2xl"
          style={{ backgroundColor: '#1a1a2e' }}
          onClick={e => e.stopPropagation()}
        >
          {/* 关闭按钮 */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 text-white/60 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>

          {/* 标题 */}
          <div 
            className="px-6 py-4 border-b border-white/10"
            style={{ backgroundColor: config.visual.accentColor }}
          >
            <h2 className="text-xl font-bold text-white">
              {t(config.nameKey)}
            </h2>
          </div>

          {/* 主内容 - 左右分区 */}
          <div className="flex flex-col md:flex-row h-[calc(90vh-80px)]">
            {/* 左面板 - 车辆业务 */}
            <div className="flex-1 p-4 overflow-y-auto border-r border-white/10">
              <VehicleBusinessPanel 
                region={region}
                config={config}
              />
            </div>

            {/* 右面板 - 证件业务 */}
            <div className="flex-1 p-4 overflow-y-auto">
              <LicenseBusinessPanel 
                region={region}
                config={config}
              />
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
