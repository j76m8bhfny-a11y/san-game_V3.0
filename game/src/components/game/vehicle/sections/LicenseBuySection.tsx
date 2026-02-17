import React from 'react';
import { motion } from 'framer-motion';
import { useI18n } from '@/i18n';
import { useGameStore } from '@/store/useGameStore';
import { RegionID } from '@/types/schema';
import { VehicleShopUIText } from '../config/vehicleShopConfig';
import { getAvailableLicenses, hasLicense } from '../config/vehicleShopConfig';
import { CreditCard, AlertTriangle, Shield } from 'lucide-react';

interface LicenseBuySectionProps {
  region: RegionID;
  uiText: VehicleShopUIText;
  isElite?: boolean;
}

export const LicenseBuySection: React.FC<LicenseBuySectionProps> = ({
  region,
  uiText,
  isElite
}) => {
  const { t } = useI18n();
  const { vitality, inventory, buyItem } = useGameStore();

  const licenses = getAvailableLicenses(region);
  const playerGold = vitality.metrics.gold;
  
  // 检查驾照状态
  const hasAnyLicense = hasLicense(inventory);
  const hasValidLicense = inventory.includes('LICENSE_VALID') || inventory.includes('LICENSE_ELITE');
  const hasFakeLicense = inventory.includes('LICENSE_FAKE');

  const handleBuy = (licenseId: string, price: number) => {
    if (playerGold < price) return;
    buyItem(licenseId);
  };

  // 过滤驾照：如果不是elite模式，排除精英驾照
  const filteredLicenses = isElite 
    ? licenses.filter(l => l.type === 'ELITE')
    : licenses.filter(l => l.type !== 'ELITE');

  if (filteredLicenses.length === 0) return null;

  return (
    <div className="p-4 rounded-lg border border-white/10 bg-white/5">
      <h4 className="text-white font-semibold mb-2">
        {isElite 
          ? t(uiText.eliteLicenseTitleKey || 'vehicleShop.downtown.eliteLicenseTitle')
          : t(uiText.licenseTitleKey)
        }
      </h4>

      {uiText.licenseSubtitleKey && (
        <p className="text-white/50 text-sm mb-3">{t(uiText.licenseSubtitleKey)}</p>
      )}

      {isElite && (
        <p className="text-white/50 text-sm mb-3">{t('vehicleShop.downtown.eliteLicenseDesc')}</p>
      )}

      <div className="space-y-3">
        {filteredLicenses.map(license => {
          const canAfford = playerGold >= license.price;
          const isFake = license.type === 'FAKE';
          const isEliteLicense = license.type === 'ELITE';
          const isValid = license.type === 'VALID';
          
          // 购买条件判断
          let canBuy = canAfford;
          let disabledReason = '';
          
          if (hasValidLicense) {
            // 已有正式驾照：什么都不能买
            canBuy = false;
            disabledReason = 'vehicleShop.common.alreadyOwned';
          } else if (hasFakeLicense) {
            // 已有假证：只能买正式/精英驾照
            if (isFake) {
              canBuy = false;
              disabledReason = 'vehicleShop.common.alreadyOwned';
            } else {
              canBuy = canAfford;
            }
          } else {
            // 没有驾照：可以买任何
            canBuy = canAfford && !hasAnyLicense;
            if (hasAnyLicense && !canAfford) {
              disabledReason = 'vehicleShop.common.insufficientFunds';
            }
          }

          return (
            <motion.div
              key={license.id}
              className="p-3 rounded border border-white/10 bg-white/5"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${isEliteLicense ? 'bg-yellow-500/20' : 'bg-white/10'}`}>
                  {isEliteLicense ? (
                    <Shield size={18} className="text-yellow-400" />
                  ) : (
                    <CreditCard size={18} className="text-white/70" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h5 className="text-white font-medium">
                      {t(license.nameKey)}
                    </h5>
                    <span className="text-yellow-400 font-mono">
                      ${license.price.toLocaleString()}
                    </span>
                  </div>

                  <p className="text-white/50 text-sm mt-1">
                    {t(`${license.nameKey.replace('.name', '.flavor')}`)}
                  </p>

                  {/* 风险提示（假证） */}
                  {isFake && (
                    <div className="flex items-center gap-1 mt-2 text-red-400 text-xs">
                      <AlertTriangle size={12} />
                      <span>{t('license.fake.risk')}</span>
                    </div>
                  )}

                  {/* 特权说明（精英驾照） */}
                  {isEliteLicense && (
                    <div className="flex items-center gap-1 mt-2 text-yellow-400 text-xs">
                      <Shield size={12} />
                      <span>{t('license.elite.perk')}</span>
                    </div>
                  )}

                  {/* 等待提示 */}
                  {license.waitTurns && license.waitTurns > 0 && (
                    <p className="text-amber-400 text-xs mt-2">
                      {t('license.valid.dmvWait', { turns: license.waitTurns })}
                    </p>
                  )}

                  {/* 购买按钮 */}
                  <button
                    onClick={() => handleBuy(license.id, license.price)}
                    disabled={!canBuy}
                    className={`mt-3 w-full py-2 px-4 rounded text-sm font-medium transition-all ${
                      canBuy
                        ? isEliteLicense
                          ? 'bg-yellow-600 hover:bg-yellow-500 text-white'
                          : 'bg-blue-600 hover:bg-blue-500 text-white'
                        : 'bg-white/10 text-white/30 cursor-not-allowed'
                    }`}
                  >
                    {!canAfford && !disabledReason
                      ? t('vehicleShop.common.insufficientFunds')
                      : disabledReason
                      ? t(disabledReason)
                      : t('vehicleShop.common.buy')
                    }
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
