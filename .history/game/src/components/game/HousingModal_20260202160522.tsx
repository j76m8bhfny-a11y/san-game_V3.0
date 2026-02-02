import React, { useMemo, useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { MedicalService, RegionID, DiseaseType } from '@/types/schema';
import { calculateMedicalCost, getHospitalTheme } from '@/logic/medical';
import { Heart, Activity, Skull, Shield, AlertCircle, Clock, CreditCard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const HospitalModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { 
    vitality, 
    currentRegion, 
    gameDataCache, 
    activeInsurance, 
    activeHousing,
    addTransaction, 
    modifyStats, 
    addNotification,
    cureDisease,
    setHospitalOpen 
  } = useGameStore();

  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);

  // 1. 获取当前区域服务
  const services = useMemo(() => {
    if (!gameDataCache?.hospitalServices) return [];
    return gameDataCache.hospitalServices.filter((s: MedicalService) => s.region === currentRegion);
  }, [gameDataCache, currentRegion]);

  // 2. 检测是否处于“强制急诊”状态
  // 如果有急性病 (ACUTE) 且未治愈，强制显示急诊界面，且不能关闭 (除非点击放弃治疗去死，或者治好)
  const emergencyDiseases = useMemo(() => {
    return vitality.activeDiseases
      .map(id => gameDataCache?.diseases?.find(d => d.id === id))
      .filter(d => d?.type === 'ACUTE');
  }, [vitality.activeDiseases, gameDataCache]);

  const isEmergencyMode = emergencyDiseases.length > 0;
  const theme = getHospitalTheme(currentRegion);

  // 3. 购买处理逻辑
  const handlePurchase = (service: MedicalService) => {
    // A. 门槛检查 (耐药性/成瘾性)
    if (service.requirements?.maxAddiction && vitality.metrics.addiction > service.requirements.maxAddiction) {
      addNotification("耐药性过高，药物无效！", "error");
      return;
    }

    // B. 排队检查 (简单模拟：如果有 waitTurns，这就只是个挂号操作)
    // 这里为了流畅性，假设只有 "0" 等待的才能买，或者做成概率失败
    if (service.requirements?.waitTurns && service.requirements.waitTurns[0] > 0) {
       // TODO: 实现真实的挂号系统。这里暂时用运气判定：
       const waitTime = Math.floor(Math.random() * (service.requirements.waitTurns[1] - service.requirements.waitTurns[0])) + service.requirements.waitTurns[0];
       if (waitTime > 2) { // 假设运气不好
         addNotification(`号源已满！最早预约在 ${waitTime} 周后。`, "warning");
         return; 
       }
       addNotification("运气不错，刚好有人退号！", "success");
    }

    // C. 费用计算
    const { finalCost, reason } = calculateMedicalCost(service, activeInsurance, vitality.identity.currentClass);

    // D. 资金检查与贷款逻辑
    if (finalCost > 0 && vitality.metrics.gold < finalCost) {
      // 自动贷款逻辑 (BankSystem Hook 应该在这里接入，这里简化处理)
      const loanNeeded = finalCost - vitality.metrics.gold;
      addTransaction('BANK', loanNeeded, `自动医疗贷款: ${service.name}`);
      addNotification(`资金不足，自动申请了 $${loanNeeded} 贷款`, "warning");
      // 注意：这里先发钱再扣钱，保证余额不为负(除非逻辑允许负债)
    }

    // E. 扣费与执行
    addTransaction('MEDICAL', -finalCost, `医疗服务: ${service.name}`);
    
    // 应用效果
    const effects = service.effects || {};
    modifyStats({
      hp: effects.hpRestore,
      san: effects.sanRestore,
      maxHp: effects.hpCapMod,
      addiction: effects.addiction
    });

    // 治病逻辑
    if (effects.cureType) {
      // 治愈所有符合类型的病
      vitality.activeDiseases.forEach(dId => {
        const d = gameDataCache?.diseases?.find(dx => dx.id === dId);
        if (d && effects.cureType?.includes(d.type)) {
          cureDisease(dId);
        }
      });
    }
    // 特指治愈
    if (effects.cureDiseases) {
      effects.cureDiseases.forEach(id => cureDisease(id));
    }

    addNotification(`治疗完成。(${reason})`, "success");
    
    // 如果是急诊模式且病好了，允许关闭
    if (isEmergencyMode) {
       // 检查是否还有急性病，这里会有个状态同步延迟，实际开发可能需要 useEffect 监听
       // 暂时假设一次急诊治好所有急性病
       if (effects.cureType?.includes('ACUTE')) {
         onClose();
       }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`w-full max-w-5xl h-[85vh] ${theme.bg} rounded-2xl border ${theme.border} shadow-2xl flex flex-col overflow-hidden relative`}
      >
        {/* 急诊警报条 */}
        {isEmergencyMode && (
          <div className="bg-red-600 text-white px-4 py-2 text-center font-bold animate-pulse flex items-center justify-center gap-2">
            <AlertCircle /> 紧急医疗介入：检测到生命垂危状态。强制治疗中。
          </div>
        )}

        {/* Header */}
        <div className="p-8 border-b border-white/10 flex justify-between items-end bg-gradient-to-r from-black/20 to-transparent">
          <div>
            <div className={`text-5xl mb-2 ${theme.accent}`}>{theme.icon}</div>
            <h1 className="text-3xl font-black text-white tracking-tight">{theme.name}</h1>
            <p className="text-white/50 mt-1 font-serif italic">{theme.desc}</p>
          </div>
          
          <div className="text-right">
             <div className="text-xs text-white/40 uppercase mb-1">当前医保</div>
             <div className="flex items-center gap-2 text-emerald-400 font-mono font-bold bg-emerald-900/20 px-3 py-1 rounded border border-emerald-500/30">
               <Shield size={14} />
               {activeInsurance ? activeInsurance.name : "无 (自费)"}
             </div>
             
             {vitality.metrics.addiction > 0 && (
               <div className="mt-2 text-xs text-purple-400 flex justify-end items-center gap-1">
                 <Skull size={12} /> 成瘾度: {vitality.metrics.addiction}%
               </div>
             )}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* 左侧：服务列表 */}
          <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
             {services.map((service: MedicalService) => {
               const costInfo = calculateMedicalCost(service, activeInsurance, vitality.identity.currentClass);
               const isAffordable = vitality.metrics.gold >= costInfo.finalCost;
               const isWaitlist = service.requirements?.waitTurns && service.requirements.waitTurns[1] > 0;
               
               // 如果是急诊模式，只显示急诊服务或手术
               if (isEmergencyMode && service.type !== 'EMERGENCY' && service.type !== 'SURGERY') return null;

               return (
                 <button
                   key={service.id}
                   onClick={() => setSelectedServiceId(service.id)}
                   className={`w-full text-left p-4 rounded-xl border transition-all group relative overflow-hidden
                     ${selectedServiceId === service.id 
                       ? `bg-white/10 ${theme.border} ring-1 ring-white/20` 
                       : 'bg-white/5 border-white/5 hover:bg-white/10'}
                   `}
                 >
                   <div className="flex justify-between items-start relative z-10">
                     <div>
                       <div className="flex items-center gap-2">
                          <span className={`text-xs px-1.5 py-0.5 rounded font-bold ${
                            service.type === 'SPECIAL' ? 'bg-purple-500/20 text-purple-400' : 
                            service.type === 'DRUG' ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-700 text-gray-300'
                          }`}>
                            {service.type}
                          </span>
                          <h3 className="font-bold text-lg text-gray-200">{service.name}</h3>
                       </div>
                       <p className="text-xs text-gray-500 mt-1 line-clamp-1">{service.flavorText}</p>
                     </div>

                     <div className="text-right">
                       <div className={`font-mono font-bold text-lg ${costInfo.finalCost > 0 ? 'text-white' : 'text-emerald-400'}`}>
                         {costInfo.finalCost > 0 ? `$${costInfo.finalCost}` : `+$${Math.abs(costInfo.finalCost)}`}
                       </div>
                       {costInfo.coveredAmount > 0 && (
                         <div className="text-[10px] text-emerald-500/80">
                           医保已付 ${costInfo.coveredAmount}
                         </div>
                       )}
                     </div>
                   </div>
                 </button>
               );
             })}
          </div>

          {/* 右侧：详情与确认 */}
          <div className="w-1/3 bg-black/20 border-l border-white/10 p-6 flex flex-col">
            {selectedServiceId ? (
              (() => {
                const service = services.find(s => s.id === selectedServiceId)!;
                const costInfo = calculateMedicalCost(service, activeInsurance, vitality.identity.currentClass);
                
                return (
                  <>
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold mb-4">{service.name}</h2>
                      
                      <div className="space-y-4 text-sm">
                        <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                           <h4 className="text-gray-500 text-xs uppercase mb-2">治疗效果</h4>
                           <div className="space-y-1">
                             {service.effects?.hpRestore && <EffectRow label="HP 恢复" value={service.effects.hpRestore} icon={<Heart size={14}/>} color="text-red-400"/>}
                             {service.effects?.sanRestore && <EffectRow label="SAN 恢复" value={service.effects.sanRestore} icon={<Activity size={14}/>} color="text-blue-400"/>}
                             {service.effects?.addiction && <EffectRow label="成瘾性" value={service.effects.addiction} icon={<Skull size={14}/>} color="text-purple-400"/>}
                             {service.effects?.hpCapMod && <EffectRow label="生命上限" value={service.effects.hpCapMod} icon={<AlertCircle size={14}/>} color="text-orange-400"/>}
                           </div>
                        </div>

                        {service.requirements?.waitTurns && (
                          <div className="flex items-center gap-2 text-yellow-500 text-xs bg-yellow-900/20 p-2 rounded">
                             <Clock size={14}/> 
                             <span>需排队等待 {service.requirements.waitTurns[0]} - {service.requirements.waitTurns[1]} 周</span>
                          </div>
                        )}

                        <div className="text-xs text-gray-500 font-serif italic border-t border-white/10 pt-4">
                          "{service.flavorText}"
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                       {/* 费用明细 */}
                       <div className="flex justify-between text-xs text-gray-400">
                         <span>基础费用:</span>
                         <span>${costInfo.originalCost}</span>
                       </div>
                       <div className="flex justify-between text-xs text-emerald-500">
                         <span>保险覆盖 ({costInfo.reason}):</span>
                         <span>-${costInfo.coveredAmount}</span>
                       </div>
                       <div className="border-t border-white/10 pt-2 flex justify-between font-bold text-lg mb-4">
                         <span>应付总额:</span>
                         <span className={costInfo.finalCost > vitality.metrics.gold ? 'text-red-500' : 'text-white'}>
                           ${costInfo.finalCost}
                         </span>
                       </div>

                       <button
                         onClick={() => handlePurchase(service)}
                         className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2
                           ${vitality.metrics.gold >= costInfo.finalCost 
                             ? 'bg-white text-black hover:scale-[1.02]' 
                             : 'bg-red-600 text-white hover:bg-red-700' // 没钱也可以点，触发贷款
                           }
                         `}
                       >
                         {vitality.metrics.gold >= costInfo.finalCost ? (
                           <>支付并治疗</>
                         ) : (
                           <><CreditCard size={18}/> 贷款支付</>
                         )}
                       </button>
                    </div>
                  </>
                );
              })()
            ) : (
              <div className="h-full flex items-center justify-center text-gray-600">
                请选择一项服务
              </div>
            )}
          </div>
        </div>

        {/* Close Button (仅非急诊模式可用) */}
        {!isEmergencyMode && (
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 text-gray-400 transition-colors"
          >
            ✕
          </button>
        )}
      </motion.div>
    </div>
  );
};

const EffectRow = ({ label, value, icon, color }: any) => (
  <div className={`flex justify-between items-center ${color}`}>
    <div className="flex items-center gap-2">{icon} {label}</div>
    <div className="font-mono font-bold">{value > 0 ? '+' : ''}{value}</div>
  </div>
);