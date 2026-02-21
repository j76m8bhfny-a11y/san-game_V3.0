import React, { useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useGameStore } from '@/store/useGameStore';
import { useAudioStore } from '@/store/useAudioStore';
import { useI18n } from '@/i18n';
import { PlayerClass } from '@/types/schema';
import { X, Heart, Brain, Wallet, Utensils, Syringe, Shield, Home, Briefcase, AlertTriangle } from 'lucide-react';
import vitalityRules from '@/assets/data/rules/vitalityRules.json';
import INITIAL_STATE from '@/assets/data/config/initial_state.json';
import SYSTEM_RULES from '@/assets/data/config/system_rules.json';

// 阶级视觉配置
const CLASS_CONFIG: Record<PlayerClass, { icon: string; color: string }> = {
  [PlayerClass.Homeless]: { 
    icon: '🏚️', color: 'text-stone-400'
  },
  [PlayerClass.Worker]: { 
    icon: '⚒️', color: 'text-sky-400'
  },
  [PlayerClass.Middle]: { 
    icon: '👔', color: 'text-indigo-400'
  },
  [PlayerClass.Capitalist]: { 
    icon: '🎩', color: 'text-amber-400'
  }
};

// 阶级 i18n key 映射
const CLASS_I18N_KEY: Record<PlayerClass, string> = {
  [PlayerClass.Homeless]: 'homeless',
  [PlayerClass.Worker]: 'worker',
  [PlayerClass.Middle]: 'middle',
  [PlayerClass.Capitalist]: 'capitalist',
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const PlayerStatsPanel: React.FC<Props> = ({ isOpen, onClose }) => {
  const { playSfx } = useAudioStore();
  const { t } = useI18n();
  const { 
    vitality, 
    activeHousing, 
    bank,
    crypto,
    gameDataCache,
    inventory
  } = useGameStore();

  const { hp, maxHp, insight, gold, addiction, hunger, creditScore } = vitality.metrics;
  const { currentClass, points } = vitality.identity;
  const { activeDiseases, activeInsurances } = vitality;
  
  // 获取医疗保险
  const activeInsurance = activeInsurances.find((ins: any) => ins.type === 'MEDICAL') || null;
  const maxInsight = (vitality.metrics as any).maxInsight || INITIAL_STATE.vitality.maxInsight;
  const GLOBAL_MAX = SYSTEM_RULES.caps.maxStat;

  const classInfo = CLASS_CONFIG[currentClass as PlayerClass] || CLASS_CONFIG[PlayerClass.Homeless];
  const classI18nKey = CLASS_I18N_KEY[currentClass as PlayerClass] || 'homeless';
  const { thresholds } = vitalityRules.visuals;

  // ESC 键关闭
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        playSfx('sfx_click');
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose, playSfx]);

  // 计算净资产
  const netWorth = useMemo(() => {
    let worth = gold;
    if (activeHousing) {
      const housingDef = gameDataCache?.housing?.find(h => h.id === activeHousing.definitionId);
      if (housingDef) worth += housingDef.value;
    }
    crypto.positions.forEach(pos => {
      const currentValue = pos.type === 'LONG' 
        ? (crypto.btcPrice - pos.entryPrice) * pos.leverage * (pos.principal / pos.entryPrice) + pos.principal
        : (pos.entryPrice - crypto.btcPrice) * pos.leverage * (pos.principal / pos.entryPrice) + pos.principal;
      worth += currentValue;
    });
    const totalDebt = bank.activeLoans.reduce((sum, loan) => sum + loan.principal + loan.interest, 0);
    return worth - totalDebt;
  }, [gold, activeHousing, crypto, gameDataCache?.housing, bank.activeLoans]);

  // 疾病名称
  const diseaseNames = useMemo(() => {
    if (!gameDataCache?.diseases) return [];
    return activeDiseases
      .map(id => (gameDataCache.diseases as any[]).find(d => d.id === id)?.name)
      .filter(Boolean) as string[];
  }, [activeDiseases, gameDataCache]);

  if (!isOpen) return null;

  const handleClose = () => {
    playSfx('sfx_click');
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999]" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
      {/* 遮罩层 - 全屏可点击 */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm cursor-pointer"
        onClick={handleClose}
        style={{ position: 'absolute', inset: 0 }}
      />
      
      {/* 面板容器 - 位于顶部 */}
      <div 
        className="absolute left-1/2 -translate-x-1/2 w-[98%] max-w-5xl pointer-events-auto"
        style={{ top: '80px', position: 'absolute' }}
      >
        {/* 面板内容 */}
        <div className="bg-gradient-to-b from-[#1a1a2e] to-[#0f0f1a] rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
          {/* 顶部装饰线 */}
          <div className="h-1 bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500" />
          
          {/* 紧凑内容区 */}
          <div className="p-4 space-y-3">
            
            {/* 第一行：身份 + 核心属性 */}
            <div className="flex items-center gap-4">
              {/* 阶级标识 */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 shrink-0">
                <span className="text-xl">{classInfo.icon}</span>
                <div>
                  <div className={`text-sm font-bold ${classInfo.color}`}>
                    {t(`hud.class.${classI18nKey}.label`)}
                  </div>
                  <div className="text-[10px] text-gray-500">
                    {t(`hud.class.${classI18nKey}.desc`)}
                  </div>
                </div>
              </div>

              {/* 核心属性 - 紧凑条形式 */}
              <div className="flex-1 grid grid-cols-4 gap-2">
                <MiniBar 
                  icon={<Heart size={12} />} 
                  label={t('hud.stats.hp_short')} 
                  value={hp} 
                  max={maxHp} 
                  color="bg-red-500" 
                  warning={hp < thresholds.hpLow} 
                />
                <MiniBar 
                  icon={<Brain size={12} />} 
                  label={t('hud.stats.insight_short')} 
                  value={insight} 
                  max={maxInsight} 
                  color={insight > (thresholds.insightHigh ?? 70) ? "bg-amber-500" : "bg-purple-500"} 
                  warning={insight > (thresholds.insightAwaken ?? 85)} 
                />
                <MiniBar 
                  icon={<Utensils size={12} />} 
                  label={t('hud.stats.hunger')} 
                  value={hunger} 
                  max={100} 
                  color="bg-orange-500" 
                  warning={hunger < 30} 
                />
                <MiniBar 
                  icon={<Syringe size={12} />} 
                  label={t('hud.stats.addiction')} 
                  value={addiction} 
                  max={GLOBAL_MAX} 
                  color="bg-fuchsia-500" 
                  warning={addiction > thresholds.addictionHigh} 
                />
              </div>
            </div>

            {/* 第二行：货币 + 政治倾向 */}
            <div className="flex items-center gap-4">
              {/* 货币信息 */}
              <div className="flex items-center gap-3 shrink-0">
                <MoneyBox 
                  label={t('hud.stats.gold')} 
                  value={gold} 
                  color={gold >= 0 ? 'text-green-400' : 'text-red-400'} 
                />
                <MoneyBox 
                  label={t('statsPanel.netWorth')} 
                  value={netWorth} 
                  color={netWorth >= 0 ? 'text-emerald-400' : 'text-rose-400'} 
                />
                <div className="px-3 py-1.5 rounded-lg bg-black/40 border border-white/10">
                  <div className="text-[10px] text-gray-500">{t('hud.stats.credit')}</div>
                  <div className={`text-sm font-mono font-bold ${creditScore >= 650 ? 'text-blue-400' : creditScore >= 500 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {creditScore}
                  </div>
                </div>
              </div>

              <div className="w-px h-8 bg-white/10 shrink-0" />

              {/* 政治倾向 - 三点式 */}
              <div className="flex items-center gap-4 flex-1">
                <PointDot icon="🔴" label={t('statsPanel.tendency.red')} value={points.red} color="bg-red-500" />
                <PointDot icon="🐺" label={t('statsPanel.tendency.wolf')} value={points.wolf} color="bg-amber-500" />
                <PointDot icon="👁️" label={t('statsPanel.tendency.old')} value={points.old} color="bg-purple-500" />
              </div>

              {/* 关闭按钮 */}
              <button 
                onClick={handleClose}
                className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all active:scale-95 shrink-0"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            {/* 第三行：资产状态 + 警告 */}
            <div className="flex items-center gap-3 pt-2 border-t border-white/10">
              {/* 资产图标组 */}
              <div className="flex items-center gap-2 shrink-0">
                <StatusIcon 
                  icon={<Home size={14} />} 
                  label={activeHousing ? t('hud.status.hasHousing') : t('hud.status.homeless')} 
                  active={!!activeHousing} 
                />
                <StatusIcon 
                  icon={<Shield size={14} />} 
                  label={activeInsurance ? t('hud.status.hasInsurance') : t('hud.status.noInsurance')} 
                  active={!!activeInsurance} 
                />
                <StatusIcon 
                  icon={<Briefcase size={14} />} 
                  label={vitality.activeJobs.length > 0 ? t('hud.status.employed', { count: vitality.activeJobs.length }) : t('hud.status.unemployed')} 
                  active={vitality.activeJobs.length > 0} 
                />
                <StatusIcon 
                  icon={<Wallet size={14} />} 
                  label={t('hud.status.inventory', { current: inventory.length, max: 20 })} 
                  active={inventory.length < 20} 
                />
              </div>

              <div className="flex-1 min-w-4" />

              {/* 警告区域 */}
              <div className="flex items-center gap-2 flex-wrap justify-end">
                {diseaseNames.map((name, i) => (
                  <span key={i} className="px-2 py-1 rounded text-[10px] bg-purple-500/20 text-purple-400 border border-purple-500/30 whitespace-nowrap">
                    🦠 {name}
                  </span>
                ))}
                {bank.activeLoans.some(l => l.overdueTurns > 0) && (
                  <span className="px-2 py-1 rounded text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 whitespace-nowrap">
                    <AlertTriangle size={10} className="inline" /> {t('hud.status.overdue')}
                  </span>
                )}
                {addiction > thresholds.addictionHigh && (
                  <span className="px-2 py-1 rounded text-[10px] bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/30 whitespace-nowrap">
                    💉 {t('hud.status.addiction')}
                  </span>
                )}
                {hunger < 30 && (
                  <span className="px-2 py-1 rounded text-[10px] bg-orange-500/20 text-orange-400 border border-orange-500/30 whitespace-nowrap">
                    🍖 {t('hud.status.hunger')}
                  </span>
                )}
                {diseaseNames.length === 0 && bank.activeLoans.filter(l => l.overdueTurns > 0).length === 0 && addiction <= thresholds.addictionHigh && hunger >= 30 && (
                  <span className="px-2 py-1 rounded text-[10px] bg-green-500/20 text-green-400 border border-green/30 whitespace-nowrap">
                    ✓ {t('hud.status.good')}
                  </span>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

// 迷你进度条
const MiniBar: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: number;
  max: number;
  color: string;
  warning?: boolean;
}> = ({ icon, label, value, max, color, warning }) => {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className={`px-2 py-1.5 rounded-lg bg-black/40 border ${warning ? 'border-red-500/50' : 'border-white/10'}`}>
      <div className="flex items-center justify-between mb-1">
        <span className={`text-[10px] ${warning ? 'text-red-400' : 'text-gray-500'}`}>{icon} {label}</span>
        <span className={`text-[10px] font-mono font-bold ${warning ? 'text-red-400' : 'text-white'}`}>
          {Math.floor(value)}
        </span>
      </div>
      <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full ${color} ${warning ? 'animate-pulse' : ''}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

// 货币盒子
const MoneyBox: React.FC<{
  label: string;
  value: number;
  color: string;
}> = ({ label, value, color }) => (
  <div className="px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 min-w-[80px]">
    <div className="text-[10px] text-gray-500">{label}</div>
    <div className={`text-sm font-mono font-bold ${color} truncate`}>
      ${value.toLocaleString()}
    </div>
  </div>
);

// 政治倾向点
const PointDot: React.FC<{
  icon: string;
  label: string;
  value: number;
  color: string;
}> = ({ icon, label, value, color }) => (
  <div className="flex items-center gap-2">
    <div className={`w-6 h-6 rounded-full ${color} flex items-center justify-center text-xs shadow-lg shrink-0`}>
      {icon}
    </div>
    <div>
      <div className="text-[10px] text-gray-500">{label}</div>
      <div className={`text-xs font-mono font-bold ${value > 0 ? 'text-green-400' : value < 0 ? 'text-red-400' : 'text-gray-400'}`}>
        {value > 0 ? '+' : ''}{value}
      </div>
    </div>
  </div>
);

// 状态图标
const StatusIcon: React.FC<{
  icon: React.ReactNode;
  label: string;
  active: boolean;
}> = ({ icon, label, active }) => (
  <div className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border whitespace-nowrap ${active ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-white/5 border-white/10 text-gray-500'}`}>
    {icon}
    <span className="text-[10px]">{label}</span>
  </div>
);
