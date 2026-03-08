import React from 'react';
import { motion } from 'framer-motion';
import { useI18n } from '@/i18n';
import { X, AlertTriangle } from 'lucide-react';
import { LoanProduct } from '@/types/schema';

interface LoanTermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loanProduct: LoanProduct;
  vehiclePrice: number;
  vehicleName: string;
}

export const LoanTermsModal: React.FC<LoanTermsModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  loanProduct,
  vehiclePrice,
  vehicleName
}) => {
  const { t } = useI18n();

  if (!isOpen) return null;

  // 计算贷款详情
  const downPaymentRate = 0.1; // 10%首付（掠夺性贷款）或从配置读取
  const downPayment = Math.floor(vehiclePrice * downPaymentRate);
  const loanAmount = vehiclePrice - downPayment;
  const weeklyRate = loanProduct.weeklyRate;
  const termTurns = loanProduct.termTurns;
  
  // 计算周供（简单利息）
  const weeklyInterest = loanAmount * weeklyRate;
  const weeklyPrincipal = loanAmount / termTurns;
  const weeklyPayment = Math.floor(weeklyPrincipal + weeklyInterest);
  
  // 总成本
  const totalInterest = weeklyInterest * termTurns;
  const totalCost = downPayment + loanAmount + totalInterest;
  const apr = (weeklyRate * 52 * 100).toFixed(1);

  return (
    <div className="fixed inset-0 z-[8000] flex items-center justify-center bg-black/70 p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-md bg-[#1a1a2e] border border-white/20 rounded-sm p-6"
      >
        {/* 标题 */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-white">
            {t('vehicleShop.loan.title')}
          </h3>
          <button onClick={onClose} className="text-white/50 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* 车辆信息 */}
        <div className="mb-4 p-3 bg-white/5 rounded">
          <p className="text-white/70 text-sm">{vehicleName}</p>
          <p className="text-yellow-400 font-mono">${vehiclePrice.toLocaleString()}</p>
        </div>

        {/* 贷款条款 */}
        <div className="space-y-3 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-white/50">{t('vehicleShop.loan.downPayment')}</span>
            <span className="text-white font-mono">${downPayment.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-white/50">{t('vehicleShop.loan.apr')}</span>
            <span className="text-red-400 font-mono">{apr}%</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-white/50">{t('vehicleShop.loan.weeklyPayment')}</span>
            <span className="text-yellow-400 font-mono">${weeklyPayment.toLocaleString()}/周</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-white/50">{t('vehicleShop.loan.totalCost')}</span>
            <span className="text-white font-mono">${totalCost.toLocaleString()}</span>
          </div>
        </div>

        {/* 警告 */}
        <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded mb-4">
          <AlertTriangle size={16} className="text-red-400 mt-0.5" />
          <p className="text-red-400 text-xs">
            {t('vehicleShop.loan.repossessionWarning', { weeks: 2 })}
          </p>
        </div>

        {/* 按钮 */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 px-4 rounded text-sm font-medium bg-white/10 text-white hover:bg-white/20 transition-all"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2 px-4 rounded text-sm font-medium bg-amber-600 hover:bg-amber-500 text-white transition-all"
          >
            {t('vehicleShop.loan.signContract')}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
