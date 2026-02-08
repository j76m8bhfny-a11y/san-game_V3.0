import React, { useMemo, useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { MedicalService, PlayerClass } from '@/types/schema';
import { calculateMedicalCost, getHospitalTheme, calculateRiskRate } from '@/logic/medical';
import { Heart, Activity, Shield, CreditCard, AlertTriangle } from 'lucide-react';
// ✅ 引入医疗规则配置，用于获取 UI 文案
import medicalRules from '@/assets/data/rules/medicalRules.json';
// ✅ 修复：统一使用静态数据源，避免缓存和实际数据不一致
import hospitalData from '@/assets/data/hospital_services.json';

// 默认 UI 文案兜底
const defaultUiText = {
  confirmSurgery: "签署免责协议并手术",
  payAndTreat: "支付并治疗",
  insufficientFunds: "余额不足"
};

// 安全获取 UI 文案
const getUiText = (key: keyof typeof defaultUiText): string => {
  return medicalRules.uiText?.[key] ?? defaultUiText[key];
};

export const HospitalModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { 
    vitality, 
    currentRegion, 
    gameDataCache, 
    activeInsurance, 
    performTreatment, 
    addNotification
  } = useGameStore();

  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);

  // 获取样式主题
  // ✅ 修复：主题只依赖 region，减少不必要的重算
  const theme = useMemo(() =>
    getHospitalTheme(currentRegion, gameDataCache ?? undefined),
    [currentRegion]
  );

  // 获取当前区域服务
  // ✅ 修复：统一使用静态数据源 hospitalData，避免与 performTreatment 逻辑不一致
  const services = useMemo(() => {
    return (hospitalData as MedicalService[]).filter((s) => s.region === currentRegion);
  }, [currentRegion]);

  if (!isOpen) return null;

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
          
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
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
              // 防御性检查：确保 vitality 状态存在
              const currentClass = vitality?.identity?.currentClass;
              const currentGold = vitality?.metrics?.gold ?? 0;
              
              // ✅ 修复：更严格的类型检查，确保 currentClass 是有效的 PlayerClass
              if (!currentClass || !Object.values(PlayerClass).includes(currentClass)) {
                return <div className="text-red-500">玩家状态异常</div>;
              }
              
              // 实时计算费用预览
              const costInfo = calculateMedicalCost(selectedService, activeInsurance, currentClass);
              const canAfford = currentGold >= costInfo.finalCost;
              
              // ✅ 使用统一的风险率计算函数
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
                        <EffectRow label="HP 恢复" value={selectedService.effects?.hpRestore} icon={<Heart size={14}/>} color="text-green-400" />
                        <EffectRow label="SAN 恢复" value={selectedService.effects?.sanRestore} icon={<Activity size={14}/>} color="text-blue-400" />
                        {selectedService.effects?.addiction && (
                            <EffectRow label="成瘾性" value={selectedService.effects.addiction} icon={<AlertTriangle size={14}/>} color="text-purple-500" />
                        )}
                        
                        {/* ✅ 使用修正后的 displayRisk */}
                        {displayRisk > 0 && (
                            <div className="flex justify-between items-center text-red-500">
                                <div className="flex items-center gap-2"><AlertTriangle size={14}/> 手术风险</div>
                                <div className="font-mono font-bold">{(displayRisk * 100).toFixed(0)}%</div>
                            </div>
                        )}
                    </div>

                    {/* Cost Breakdown */}
                    <div className="space-y-2 mt-8">
                      <div className="flex justify-between text-sm text-gray-500">
                        <span>医疗原价</span>
                        <span>${costInfo.originalCost}</span>
                      </div>
                      {costInfo.coveredAmount > 0 && (
                        <div className="flex justify-between text-sm text-emerald-500">
                          <span className="flex items-center gap-1"><Shield size={12}/> 保险报销</span>
                          <span>-${costInfo.coveredAmount}</span>
                        </div>
                      )}
                      <div className="border-t border-white/20 pt-2 flex justify-between items-end">
                        <span className="text-sm font-bold text-white">实付金额</span>
                        <span className={`text-3xl font-mono font-black ${canAfford ? 'text-white' : 'text-red-500'}`}>
                          ${costInfo.finalCost}
                        </span>
                      </div>
                      {!canAfford && (
                        <div className="text-right text-xs text-red-500 mt-1">{getUiText('insufficientFunds')} (当前: ${currentGold})</div>
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
                         <>{displayRisk > 0 ? getUiText('confirmSurgery') : getUiText('payAndTreat')}</>
                       ) : (
                         <><CreditCard size={18}/> {getUiText('insufficientFunds')}</>
                       )}
                     </button>
                  </div>
                </>
              );
            })()
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-600 opacity-50">
              <Activity size={64} className="mb-4" />
              <div>请从左侧选择医疗服务</div>
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

// 辅助组件
interface EffectRowProps {
  label: string;
  value: number | undefined;
  icon: React.ReactNode;
  color: string;
}

const EffectRow = ({ label, value, icon, color }: EffectRowProps) => {
    if (value === undefined || value === null || value === 0) return null;
    // 显示符号：正数显示 +，负数显示 -，0 不显示
    const sign = value > 0 ? '+' : '';
    return (
        <div className={`flex justify-between items-center ${color}`}>
            <div className="flex items-center gap-2">{icon} {label}</div>
            <div className="font-mono font-bold">{sign}{value}</div>
        </div>
    );
};