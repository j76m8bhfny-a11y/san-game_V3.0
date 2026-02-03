import React, { useMemo, useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { MedicalService } from '@/types/schema';
import { calculateMedicalCost, getHospitalTheme } from '@/logic/medical';
import { Heart, Activity, Shield, CreditCard, AlertTriangle } from 'lucide-react';

export const HospitalModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { 
    vitality, 
    currentRegion, 
    gameDataCache, 
    activeInsurance, 
    performTreatment, // ✅ 1. 引入新 Action
    addNotification
  } = useGameStore();

  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);

  // 获取样式主题
  const theme = useMemo(() => 
    getHospitalTheme(currentRegion, gameDataCache), 
    [currentRegion, gameDataCache]
  );

  // 获取当前区域服务
  const services = useMemo(() => {
    if (!gameDataCache?.hospitalServices) return [] as MedicalService[];
    return (gameDataCache.hospitalServices as MedicalService[]).filter((s) => s.region === currentRegion);
  }, [gameDataCache, currentRegion]);

  if (!isOpen) return null;

  // 处理治疗点击
  const handleTreatment = (serviceId: string) => {
    // ✅ 2. 调用 Action 执行治疗
    const result = performTreatment(serviceId);
    
    if (result.success) {
        addNotification(result.msg, 'success');
        // 治疗成功可以选择关闭弹窗，或者留着让玩家继续操作
        onClose();
    } else {
        addNotification(result.msg, 'error');
        // 失败不关闭，让玩家看到后果
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
              // 实时计算费用预览
              const costInfo = calculateMedicalCost(selectedService, activeInsurance, vitality.identity.currentClass);
              const canAfford = vitality.metrics.gold >= costInfo.finalCost;
              const riskRate = selectedService.requirements?.riskRate || 0;

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
                        {riskRate > 0 && (
                            <div className="flex justify-between items-center text-red-500">
                                <div className="flex items-center gap-2"><AlertTriangle size={14}/> 手术风险</div>
                                <div className="font-mono font-bold">{(riskRate * 100).toFixed(0)}%</div>
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
                        <div className="text-right text-xs text-red-500 mt-1">资金不足 (当前: ${vitality.metrics.gold})</div>
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
                         <>{riskRate > 0 ? '签署免责协议并手术' : '支付并治疗'}</>
                       ) : (
                         <><CreditCard size={18}/> 余额不足</>
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
const EffectRow = ({ label, value, icon, color }: any) => {
    if (!value) return null;
    return (
        <div className={`flex justify-between items-center ${color}`}>
            <div className="flex items-center gap-2">{icon} {label}</div>
            <div className="font-mono font-bold">{value > 0 ? '+' : ''}{value}</div>
        </div>
    );
};