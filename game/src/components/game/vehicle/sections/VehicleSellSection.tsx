import React from 'react';
import { motion } from 'framer-motion';
import { useI18n } from '@/i18n';
import { useGameStore } from '@/store/useGameStore';
import { RegionID } from '@/types/schema';
import { VehicleShopUIText } from '../config/vehicleShopConfig';
import { getCurrentVehicle, getVehicleConfig, getVehicleSellPrice } from '../config/vehicleShopConfig';
import { DollarSign, Car } from 'lucide-react';

interface VehicleSellSectionProps {
  region: RegionID;
  uiText: VehicleShopUIText;
  isTradeIn?: boolean;
}

export const VehicleSellSection: React.FC<VehicleSellSectionProps> = ({
  region,
  uiText,
  isTradeIn
}) => {
  const { t } = useI18n();
  const { inventory, sellVehicle, calculateTradeInValue: calculateTradeInValueFromStore } = useGameStore();

  const currentVehicleId = getCurrentVehicle(inventory);
  const currentVehicle = currentVehicleId ? getVehicleConfig(currentVehicleId) : null;
  
  // ✅ 置换价格比普通售价高5%
  const sellPrice = currentVehicleId ? getVehicleSellPrice(currentVehicleId, region) : 0;
  const tradeInValue = currentVehicleId ? calculateTradeInValueFromStore(currentVehicleId, region) : 0;
  const displayPrice = isTradeIn ? tradeInValue : sellPrice;

  const handleSell = () => {
    if (!currentVehicleId) return;
    sellVehicle(region);
  };

  if (!currentVehicle) {
    return (
      <div className="p-4 rounded-lg border border-white/10 bg-white/5">
        <h4 className="text-white font-semibold mb-2">
          {isTradeIn ? t(uiText.tradeInTitleKey || '') : t(uiText.sellTitleKey)}
        </h4>
        <p className="text-white/40 text-sm">{t('vehicleShop.common.noVehicle')}</p>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-lg border border-white/10 bg-white/5">
      <h4 className="text-white font-semibold mb-3">
        {isTradeIn ? t(uiText.tradeInTitleKey || '') : t(uiText.sellTitleKey)}
      </h4>

      {uiText.sellDescKey && (
        <p className="text-white/50 text-sm mb-3">{t(uiText.sellDescKey)}</p>
      )}

      {/* 当前车辆信息 */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-white/10 rounded-lg">
          <Car size={20} className="text-white/70" />
        </div>
        <div className="flex-1">
          <h5 className="text-white font-medium">
            {t(currentVehicle.nameKey)}
          </h5>
          <p className="text-white/50 text-sm">
            {isTradeIn ? '置换估价' : t('vehicleShop.common.sellPrice')}: 
            <span className="text-yellow-400 font-mono ml-1">
              ${displayPrice.toLocaleString()}
            </span>
            {isTradeIn && sellPrice > 0 && (
              <span className="text-green-400 text-xs ml-2">
                (+${(tradeInValue - sellPrice).toLocaleString()} 置换加成)
              </span>
            )}
          </p>
        </div>
      </div>

      {/* 出售/置换按钮 */}
      <motion.button
        onClick={handleSell}
        className={`w-full py-2 px-4 rounded text-sm font-medium transition-all flex items-center justify-center gap-2 ${
          isTradeIn 
            ? 'bg-green-600/80 hover:bg-green-500 text-white'
            : 'bg-red-600/80 hover:bg-red-500 text-white'
        }`}
        whileTap={{ scale: 0.98 }}
      >
        <DollarSign size={16} />
        {isTradeIn 
          ? `置换获得 $${tradeInValue.toLocaleString()}`
          : t('vehicleShop.common.sell')
        }
      </motion.button>
      
      {isTradeIn && (
        <p className="text-white/40 text-xs mt-2 text-center">
          出售后可获得更高价格（+5%置换加成），再购买新车即可
        </p>
      )}
    </div>
  );
};
