import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useI18n } from '@/i18n';
import { useGameStore } from '@/store/useGameStore';
import { RegionID, PlayerClass, LoanProduct } from '@/types/schema';
import { VehicleShopUIText } from '../config/vehicleShopConfig';
import { getAvailableVehicles, getVehicleConfig, hasVehicleOrLease } from '../config/vehicleShopConfig';
import { LoanTermsModal } from '../shared/LoanTermsModal';
import { Car, AlertTriangle, CreditCard } from 'lucide-react';
import loansData from '@/assets/data/loans.json';
import { useThrottle } from '@/hooks/useThrottle';

interface VehicleBuySectionProps {
  region: RegionID;
  uiText: VehicleShopUIText;
  features?: {
    leaseEnabled?: boolean;
    creditCheck?: boolean;
  };
}

export const VehicleBuySection: React.FC<VehicleBuySectionProps> = ({
  region,
  uiText,
  features: _features
}) => {
  const { t } = useI18n();
  const { vitality, inventory, buyItem, takeLoan, checkCreditForPurchase, activeLease } = useGameStore();
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [loanVehicle, setLoanVehicle] = useState<{id: string, price: number, name: string, loanProductId: string} | null>(null);

  const vehicles = getAvailableVehicles(region);
  const currentClass = vitality.identity.currentClass;
  const playerGold = vitality.metrics.gold;
  // ✅ 同时检查拥有的车辆和租赁的车辆
  const alreadyHasVehicle = hasVehicleOrLease(inventory, activeLease);

  const canAfford = (price: number) => playerGold >= price;
  const meetsClassReq = (reqClass: PlayerClass) => {
    const classOrder = ['HOMELESS', 'WORKER', 'MIDDLE', 'CAPITALIST'];
    return classOrder.indexOf(currentClass) >= classOrder.indexOf(reqClass);
  };
  // ✅ 使用vehicleSlice的信用检查
  const getCreditCheckResult = (vehicleId: string) => {
    return checkCreditForPurchase(vehicleId);
  };

  // 车辆购买操作添加节流
  const [throttledBuy] = useThrottle((vehicleId: string, price: number) => {
    if (!canAfford(price)) {
      return;
    }
    buyItem(vehicleId);
    setSelectedVehicle(null);
  }, { delay: 500 });

  const [throttledLoanClick] = useThrottle((vehicleId: string, price: number, nameKey: string, loanProductId: string) => {
    setLoanVehicle({
      id: vehicleId,
      price,
      name: t(nameKey),
      loanProductId
    });
    setShowLoanModal(true);
  }, { delay: 500 });

  const [throttledLoanConfirm] = useThrottle(() => {
    if (!loanVehicle) return;
    
    const loanProduct = (loansData as unknown as LoanProduct[]).find(p => p.id === loanVehicle.loanProductId);
    if (!loanProduct) return;

    // ✅ 信用检查影响贷款利率
    const creditCheck = checkCreditForPurchase(loanVehicle.id);
    const rateModifier = creditCheck.rateModifier || 0;

    // 计算首付（10%）和贷款金额
    const downPaymentRate = 0.1;
    const downPayment = Math.floor(loanVehicle.price * downPaymentRate);
    const baseLoanAmount = loanVehicle.price - downPayment;
    
    // 如果有利率调整，增加/减少贷款金额（体现为手续费或折扣）
    const adjustedLoanAmount = Math.floor(baseLoanAmount * (1 + rateModifier));

    // 检查首付资金
    if (playerGold < downPayment) {
      return;
    }

    // 先尝试创建贷款（使用调整后的金额）
    const loanResult = takeLoan(loanVehicle.loanProductId, adjustedLoanAmount);
    if (!loanResult.success) {
      return;
    }

    // 贷款成功后扣除首付
    const state = useGameStore.getState();
    state.addTransaction('BANK', -downPayment, `车辆首付: ${loanVehicle.name}`);
    
    // ✅ 添加利率调整的交易记录
    if (rateModifier > 0) {
      const extraCost = adjustedLoanAmount - baseLoanAmount;
      state.addTransaction('BANK', -extraCost, `信用风险费 (${(rateModifier * 100).toFixed(1)}%)`);
    } else if (rateModifier < 0) {
      const discount = baseLoanAmount - adjustedLoanAmount;
      state.addTransaction('INCOME', discount, `信用优良折扣 (${(Math.abs(rateModifier) * 100).toFixed(1)}%)`);
    }
    
    // 添加车辆
    buyItem(loanVehicle.id);
    
    setShowLoanModal(false);
    setLoanVehicle(null);
  }, { delay: 500 });

  const handleBuy = (vehicleId: string, price: number) => throttledBuy(vehicleId, price);
  const handleLoanClick = (vehicleId: string, price: number, nameKey: string, loanProductId: string) => 
    throttledLoanClick(vehicleId, price, nameKey, loanProductId);
  const handleLoanConfirm = () => throttledLoanConfirm();

  return (
    <div className="space-y-4">
      {/* 标题 */}
      <div>
        <h4 className="text-white font-semibold">
          {t(uiText.buyTitleKey)}
        </h4>
        {uiText.buySubtitleKey && (
          <p className="text-white/50 text-sm">{t(uiText.buySubtitleKey)}</p>
        )}
      </div>

      {/* 车辆列表 */}
      <div className="space-y-3">
        {vehicles.map(vehicle => {
          const config = getVehicleConfig(vehicle.id);
          const affordable = canAfford(vehicle.price);
          const classOk = meetsClassReq(vehicle.requiredClass);
          const creditCheck = getCreditCheckResult(vehicle.id);
          // ✅ 如果有features.creditCheck，强制要求通过信用检查
          const creditOk = _features?.creditCheck ? creditCheck.creditCheckPassed : true;
          const canBuy = affordable && classOk && creditOk && !alreadyHasVehicle;

          return (
            <motion.div
              key={vehicle.id}
              className={`p-3 rounded-lg border ${
                selectedVehicle === vehicle.id
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-white/10 bg-white/5'
              }`}
              onClick={() => setSelectedVehicle(vehicle.id)}
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-white/10 rounded-lg">
                  <Car size={20} className="text-white/70" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h5 className="text-white font-medium">
                      {t(vehicle.nameKey)}
                    </h5>
                    <span className="text-yellow-400 font-mono">
                      ${vehicle.price.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-white/50 text-sm mt-1">
                    {t(`${vehicle.nameKey.replace('.name', '.flavor')}`)}
                  </p>

                  {/* 警告和限制 */}
                  {config?.restrictions && (
                    <div className="flex items-center gap-1 mt-2 text-amber-400 text-xs">
                      <AlertTriangle size={12} />
                      <span>{t(config.restrictions.warningKey)}</span>
                    </div>
                  )}

                  {/* 购买按钮 */}
                  <button
                    onClick={() => handleBuy(vehicle.id, vehicle.price)}
                    disabled={!canBuy}
                    className={`mt-3 w-full py-2 px-4 rounded text-sm font-medium transition-all ${
                      canBuy
                        ? 'bg-blue-600 hover:bg-blue-500 text-white'
                        : 'bg-white/10 text-white/30 cursor-not-allowed'
                    }`}
                  >
                    {!classOk 
                      ? t('vehicleShop.common.classLocked')
                      : !creditOk
                      ? `信用不足 (${creditCheck.currentScore}/${creditCheck.requiredScore})`
                      : !affordable
                      ? t('vehicleShop.common.insufficientFunds')
                      : alreadyHasVehicle
                      ? t('vehicleShop.common.alreadyOwned')
                      : t('vehicleShop.common.cashBuy')
                    }
                  </button>

                  {/* 贷款购买选项（铁锈区） */}
                  {vehicle.loanProductId && classOk && !alreadyHasVehicle && (
                    <button
                      onClick={() => handleLoanClick(vehicle.id, vehicle.price, vehicle.nameKey, vehicle.loanProductId!)}
                      className="mt-2 w-full py-2 px-4 rounded text-sm font-medium bg-amber-600/50 hover:bg-amber-600 text-white transition-all flex items-center justify-center gap-2"
                    >
                      <CreditCard size={14} />
                      {t('vehicleShop.common.loanBuy')}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* 贷款条款弹窗 */}
      {loanVehicle && (
        <LoanTermsModal
          isOpen={showLoanModal}
          onClose={() => {
            setShowLoanModal(false);
            setLoanVehicle(null);
          }}
          onConfirm={handleLoanConfirm}
          loanProduct={(loansData as unknown as LoanProduct[]).find(p => p.id === loanVehicle.loanProductId)!}
          vehiclePrice={loanVehicle.price}
          vehicleName={loanVehicle.name}
        />
      )}
    </div>
  );
};
