import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { X, Heart, Activity, DollarSign, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// 定义医院服务类型（也可以移到 schema 或 json）
interface HospitalService {
  id: string;
  name: string;
  description: string;
  cost: number;
  restoreHp: number;
  restoreSan: number;
  icon: React.ElementType;
}

const SERVICES: HospitalService[] = [
  { 
    id: 'BASIC', 
    name: '基础包扎', 
    description: '处理外伤，简单的消毒和绷带。', 
    cost: 100, 
    restoreHp: 15, 
    restoreSan: 0,
    icon: Heart 
  },
  { 
    id: 'DRUG', 
    name: '镇静剂注射', 
    description: '强效精神药物，缓解焦虑和幻觉。', 
    cost: 250, 
    restoreHp: 5, 
    restoreSan: 20,
    icon: Activity 
  },
  { 
    id: 'SURGERY', 
    name: '急救手术', 
    description: '全套创伤处理，针对重伤患者。', 
    cost: 800, 
    restoreHp: 50, 
    restoreSan: 10,
    icon: AlertCircle 
  },
  { 
    id: 'THERAPY', 
    name: '深度心理治疗', 
    description: '专业的心理干预，重建理智防线。', 
    cost: 1200, 
    restoreHp: 0, 
    restoreSan: 45,
    icon: Activity 
  }
];

interface HospitalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HospitalModal: React.FC<HospitalModalProps> = ({ isOpen, onClose }) => {
  const { vitality, addTransaction, modifyStats, addNotification } = useGameStore();
  
  if (!isOpen) return null;

  const handleBuyService = (service: HospitalService) => {
    // 1. 检查资金
    if (vitality.metrics.gold < service.cost) {
      addNotification("资金不足，医院拒绝提供服务。", "error");
      return;
    }

    // 2. 检查是否需要治疗 (可选: 满血不能治)
    if (vitality.metrics.hp >= vitality.metrics.maxHp && service.restoreHp > 0 && service.restoreSan === 0) {
      addNotification("你的身体很健康，无需治疗。", "warning");
      return;
    }

    // 3. 执行交易 (扣费 + 记账)
    addTransaction('MEDICAL', -service.cost, `医院治疗: ${service.name}`);

    // 4. 执行效果 (回血/回San)
    modifyStats({
      hp: service.restoreHp,
      san: service.restoreSan
    });

    addNotification(`接受了 ${service.name}，状态已恢复。`, "success");
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-zinc-900 border border-zinc-700 w-full max-w-2xl rounded-lg shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 border-b border-zinc-700 flex justify-between items-center bg-zinc-950">
            <div>
              <h2 className="text-2xl font-bold text-red-500 flex items-center gap-2">
                <Activity className="w-6 h-6" />
                圣伊丽莎白医院
              </h2>
              <p className="text-zinc-400 text-sm mt-1">这里只认两样东西：钱，和更值钱的器官。</p>
            </div>
            <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {SERVICES.map((service) => (
              <button
                key={service.id}
                onClick={() => handleBuyService(service)}
                className="flex flex-col text-left bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700 hover:border-red-500/50 p-4 rounded-lg transition-all group"
              >
                <div className="flex justify-between items-start w-full mb-2">
                  <div className="p-2 bg-zinc-900 rounded-md group-hover:bg-red-500/10 group-hover:text-red-500 transition-colors">
                    <service.icon className="w-5 h-5" />
                  </div>
                  <div className="flex items-center text-green-400 font-mono font-bold">
                    <DollarSign className="w-4 h-4" />
                    {service.cost}
                  </div>
                </div>
                
                <h3 className="font-bold text-zinc-100 mb-1">{service.name}</h3>
                <p className="text-xs text-zinc-400 mb-3 line-clamp-2">{service.description}</p>
                
                <div className="flex gap-3 text-xs mt-auto">
                  {service.restoreHp > 0 && (
                    <span className="flex items-center gap-1 text-red-400">
                      <Heart className="w-3 h-3" /> +{service.restoreHp}
                    </span>
                  )}
                  {service.restoreSan > 0 && (
                    <span className="flex items-center gap-1 text-blue-400">
                      <Activity className="w-3 h-3" /> +{service.restoreSan}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Footer - Player Stats */}
          <div className="bg-zinc-950 p-4 border-t border-zinc-700 flex justify-between items-center text-sm font-mono">
             <div className="flex gap-4">
               <span className="text-red-500">HP: {vitality.metrics.hp}/{vitality.metrics.maxHp}</span>
               <span className="text-blue-500">SAN: {vitality.metrics.san}/{vitality.metrics.maxSan}</span>
             </div>
             <div className="text-yellow-500">
               持有资金: ${vitality.metrics.gold}
             </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default HospitalModal;