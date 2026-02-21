import React, { useMemo, useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { useI18n } from '@/i18n';
import { MedicalService, PlayerClass, RegionID } from '@/types/schema';
import { calculateMedicalCost, getHospitalTheme, calculateRiskRate } from '@/logic/medical';
import { Heart, Activity, Shield, CreditCard, AlertTriangle, Activity as ActivityIcon } from 'lucide-react';
import medicalRules from '@/assets/data/rules/medicalRules.json';
import hospitalData from '@/assets/data/hospital_services.json';

// ✅ 1. 引入特定阶级的医疗组件
import { SlumsMedical } from './medical/SlumsMedical';
import { RustBeltMedical } from './medical/RustBeltMedical'; // (待开发)
import { SuburbsMedical } from './medical/SuburbsMedical'; // (待开发)
import { DowntownMedical } from './medical/DowntownMedical'; // (待开发)

// ==========================================
// 主入口组件 (路由分发器)
// ==========================================
export const HospitalModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { currentRegion } = useGameStore();

  if (!isOpen) return null;

  // 根据当前区域路由到对应的医疗系统 UI
  switch (currentRegion) {
    case RegionID.Slums:
      // 贫民窟：地下黑诊所
      return <SlumsMedical onClose={onClose} />;
      
    // 后续开发完成后解开注释：
    case RegionID.RustBelt:
      return <RustBeltMedical onClose={onClose} />;
    case RegionID.Suburbs:
      return <SuburbsMedical onClose={onClose} />;
    case RegionID.Downtown:
      return <DowntownMedical onClose={onClose} />;

    default:
      // 其他区域（或未开发的区域）使用通用的默认医院界面
      return <DefaultHospitalView onClose={onClose} />;
  }
};

// ==========================================
// 默认通用医院视图 (原代码封装)
// ==========================================

// 默认 UI 文案兜底
const defaultUiText = {
  confirmSurgery: "hospital.surgery.confirm",
  payAndTreat: "hospital.treatment.pay",
  insufficientFunds: "hospital.insufficientFunds"
};

const getUiText = (key: keyof typeof defaultUiText): string => {
  return (medicalRules.uiText as any)?.[key] ?? defaultUiText[key];
};

const DefaultHospitalView: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { t } = useI18n();
  const { 
    vitality, 
    currentRegion, 
    gameDataCache, 
    performTreatment, 
    addNotification
  } = useGameStore();
  
  // 获取医疗保险 - 从 vitality 中读取
  const activeInsurance = vitality.activeInsurances.find((ins: any) => ins.type === 'MEDICAL') || null;

  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);

  // 获取样式主题
  const theme = useMemo(() =>
    getHospitalTheme(currentRegion, gameDataCache ?? undefined),
    [currentRegion]
  );

  // 获取当前区域服务
  const services = useMemo(() => {
    return (hospitalData as MedicalService[]).filter((s) => s.region === currentRegion);
  }, [currentRegion]);

  // 处理治疗点击
  const handleTreatment = (serviceId: string) => {
    const result = performTreatment(serviceId);
    
    if (result.success) {
        addNotification(result.msg, 'success');
        onClose();
    } else {
        addNotification(result.msg, 'error');
    }
  };

  const selectedService = services.find(s => s.id === selectedServiceId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 font-mono">
      <div className={`w-full max-w-4xl h-[80vh] ${theme.bg} border-2 ${theme.border} rounded-xl shadow-2xl flex overflow-hidden relative`}>
        
        {/* Left: Service List */}
        <div className="w-1/3 border-r border-white/10 flex flex-col bg-black/20">
          <div className={`p-6 border-b border-white/10 ${theme.accent}`}>
            <h2 className="text-2xl font-black flex items-center gap-3">
              <span className="text-4xl">{theme.icon}</span> 
              {theme.name}
            </h2>
            <p className="text-xs opacity-60 mt-1">{theme.desc}</p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
            {services.map(service => (
              <button
                key={service.id}
                onClick={() => setSelectedServiceId(service.id)}
                className={`w-full text-left p-4 rounded-lg border transition-all ${
                  selectedServiceId === service.id 
                    ? `${theme.accent} border-current bg-white/5` 
                    : 'border-transparent text-gray-500 hover:bg-white/5 hover:text-gray-300'
                }`}
              >
                <div className="font-bold">{service.name}</div>
                <div className="text-xs opacity-50 mt-1 flex justify-between">
                   <span>{service.type}</span>
                   {/* 显示原始价格，不计算保险，作为参考 */}
                   <span>${service.baseCost}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Details & Action */}
        <div className="flex-1 p-8 flex flex-col relative">
          {selectedService ? (
            (() => {
              const currentClass = vitality?.identity?.currentClass;
              const currentGold = vitality?.metrics?.gold ?? 0;
              
              if (!currentClass || !Object.values(PlayerClass).includes(currentClass)) {
                return <div className="text-red-500">{t('hospital.error.playerStatus')}</div>;
              }
              
              const costInfo = calculateMedicalCost(selectedService, activeInsurance, currentClass);
              const canAfford = currentGold >= costInfo.finalCost;
              const displayRisk = calculateRiskRate(selectedService);

              return (
                <>
                  <div className="flex-1 space-y-6">
                    <div>
                      <h3 className={`text-3xl font-black ${theme.accent} mb-2`}>{selectedService.name}</h3>
                      <p className="text-gray-400 italic">"{selectedService.flavorText}"</p>
                    </div>

                    {/* Effects Preview */}
                    <div className="grid grid-cols-2 gap-4 bg-black/30 p-4 rounded-lg border border-white/5">
                        <EffectRow label={t('hospital.effect.hpRestore')} value={selectedService.effects?.hpRestore} icon={<Heart size={14}/>} color="text-green-400" />
                        <EffectRow label={t('hospital.effect.insightRestore')} value={selectedService.effects?.insightRestore} icon={<Activity size={14}/>} color="text-amber-400" />
                        {selectedService.effects?.addiction && (
                            <EffectRow label={t('hospital.effect.addiction')} value={selectedService.effects.addiction} icon={<AlertTriangle size={14}/>} color="text-purple-500" />
                        )}
                        
                        {displayRisk > 0 && (
                            <div className="flex justify-between items-center text-red-500">
                                <div className="flex items-center gap-2"><AlertTriangle size={14}/> {t('hospital.risk.surgery')}</div>
                                <div className="font-mono font-bold">{(displayRisk * 100).toFixed(0)}%</div>
                            </div>
                        )}
                    </div>

                    {/* Cost Breakdown */}
                    <div className="space-y-2 mt-8">
                      <div className="flex justify-between text-sm text-gray-500">
                        <span>{t('hospital.cost.original')}</span>
                        <span>${costInfo.originalCost}</span>
                      </div>
                      {costInfo.coveredAmount > 0 && (
                        <div className="flex justify-between text-sm text-emerald-500">
                          <span className="flex items-center gap-1"><Shield size={12}/> {t('hospital.insurance.covered')}</span>
                          <span>-${costInfo.coveredAmount}</span>
                        </div>
                      )}
                      <div className="border-t border-white/20 pt-2 flex justify-between items-end">
                        <span className="text-sm font-bold text-white">{t('hospital.cost.final')}</span>
                        <span className={`text-3xl font-mono font-black ${canAfford ? 'text-white' : 'text-red-500'}`}>
                          ${costInfo.finalCost}
                        </span>
                      </div>
                      {!canAfford && (
                        <div className="text-right text-xs text-red-500 mt-1">{t('hospital.insufficientFunds')} ({t('hospital.cost.current')}: ${currentGold})</div>
                      )}
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="mt-8">
                     <button
                       onClick={() => handleTreatment(selectedService.id)}
                       disabled={!canAfford}
                       className={`
                         w-full py-4 rounded-lg font-bold text-lg transition-all flex items-center justify-center gap-2
                         ${canAfford 
                           ? 'bg-white text-black hover:scale-[1.02] hover:shadow-lg' 
                           : 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700' 
                         }
                       `}
                     >
                       {canAfford ? (
                         <>{displayRisk > 0 ? t('hospital.surgery.confirm') : t('hospital.treatment.pay')}</>
                       ) : (
                         <><CreditCard size={18}/> {t('hospital.insufficientFunds')}</>
                       )}
                     </button>
                  </div>
                </>
              );
            })()
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-600 opacity-50">
              <ActivityIcon size={64} className="mb-4" />
              <div>{t('hospital.selectService')}</div>
            </div>
          )}
        </div>

        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
        >
          [ESC]
        </button>
      </div>
    </div>
  );
};

// 辅助组件：效果行
interface EffectRowProps {
  label: string;
  value: number | undefined;
  icon: React.ReactNode;
  color: string;
}

const EffectRow = ({ label, value, icon, color }: EffectRowProps) => {
    if (value === undefined || value === null || value === 0) return null;
    const sign = value > 0 ? '+' : '';
    return (
        <div className={`flex justify-between items-center ${color}`}>
            <div className="flex items-center gap-2">{icon} {label}</div>
            <div className="font-mono font-bold">{sign}{value}</div>
        </div>
    );
};