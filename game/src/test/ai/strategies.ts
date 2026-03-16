/**
 * AI策略实现
 * 包含5种AI行为模型：随机/生存/探索/极限/新手
 */

import type { 
  AIStrategy, 
  DecisionContext, 
  AIDecision, 
  AIStrategyType
} from './types';
import type { EventOption, GameEvent } from '@/types/schema';

// ==========================================
// 基类 - 提供通用工具方法
// ==========================================

abstract class BaseStrategy implements AIStrategy {
  abstract readonly type: AIStrategyType;
  abstract readonly name: string;
  
  /** 获取状态数值辅助方法 */
  protected getStats(ctx: DecisionContext) {
    const m = ctx.state.vitality.metrics;
    return {
      hp: m.hp,
      maxHp: m.maxHp || 100,
      hpPercent: m.hp / (m.maxHp || 100),
      hunger: m.hunger || 0,
      hungerPercent: (m.hunger || 0) / 100,
      insight: m.insight || 0,
      gold: m.gold || 0,
      turn: ctx.state.currentTurn
    };
  }
  
  /** 获取可用选项列表 */
  protected getAvailableOptions(event: GameEvent, insight: number): Array<{key: 'A' | 'B' | 'C' | 'D', option: EventOption}> {
    const options: Array<{key: 'A' | 'B' | 'C' | 'D', option: EventOption}> = [];
    
    (['A', 'B', 'C', 'D'] as const).forEach(key => {
      const option = event.options[key];
      if (!option) return;
      
      // D选项需要灵视>=70
      if (key === 'D' && insight < 70) return;
      
      options.push({ key, option });
    });
    
    return options;
  }
  
  /** 选项风险评估 */
  protected assessRisk(option: EventOption): number {
    const effects = option.effects;
    let risk = 0;
    
    if (effects.hp && effects.hp < 0) risk += Math.abs(effects.hp) * 2;
    if (effects.gold && effects.gold < 0) risk += Math.abs(effects.gold) * 0.1;
    
    // D选项额外风险权重
    if ((option as any).isDangerous || option.label?.includes('⚠️')) {
      risk += 15;
    }
    
    return risk;
  }
  
  /** 选项收益评估 */
  protected assessBenefit(option: EventOption): number {
    const effects = option.effects;
    let benefit = 0;
    
    if (effects.hp && effects.hp > 0) benefit += effects.hp;
    if (effects.gold && effects.gold > 0) benefit += effects.gold * 0.1;
    if (effects.insight && effects.insight > 0) benefit += effects.insight * 0.5;
    
    return benefit;
  }
  
  abstract decide(ctx: DecisionContext): AIDecision;
}

// ==========================================
// 1. 随机漫步者
// ==========================================

export class RandomStrategy extends BaseStrategy {
  readonly type = 'random' as const;
  readonly name = '随机漫步者';
  
  decide(ctx: DecisionContext): AIDecision {
    const { event } = ctx;
    
    if (!event) {
      return {
        turn: ctx.turn,
        choice: null,
        reasoning: '无事件，推进回合',
        timestamp: Date.now()
      };
    }
    
    const stats = this.getStats(ctx);
    const availableOptions = this.getAvailableOptions(event, stats.insight);
    
    if (availableOptions.length === 0) {
      return {
        turn: ctx.turn,
        eventId: event.id,
        choice: 'A',
        reasoning: '无可用选项，默认选A',
        timestamp: Date.now()
      };
    }
    
    const choice = availableOptions[Math.floor(Math.random() * availableOptions.length)].key;
    
    return {
      turn: ctx.turn,
      eventId: event.id,
      choice,
      reasoning: `随机选择: ${choice}`,
      timestamp: Date.now()
    };
  }
}

// ==========================================
// 2. 生存优先者
// ==========================================

export class SurvivalStrategy extends BaseStrategy {
  readonly type = 'survival' as const;
  readonly name = '生存优先者';
  
  decide(ctx: DecisionContext): AIDecision {
    const { event } = ctx;
    
    if (!event) {
      return {
        turn: ctx.turn,
        choice: null,
        reasoning: '无事件',
        timestamp: Date.now()
      };
    }
    
    const stats = this.getStats(ctx);
    const options = this.getAvailableOptions(event, stats.insight);
    
    if (options.length === 0) {
      return {
        turn: ctx.turn,
        eventId: event.id,
        choice: 'A',
        reasoning: '无可用选项，默认选A',
        timestamp: Date.now()
      };
    }
    
    // 危急状态判断
    const isCritical = stats.hpPercent < 0.25 || stats.hungerPercent > 0.8;
    
    let choice: 'A' | 'B' | 'C' | 'D';
    
    if (isCritical) {
      // 危急状态：选择风险最低的
      const safest = options.sort((a, b) => {
        return this.assessRisk(a.option) - this.assessRisk(b.option);
      })[0];
      choice = safest.key;
    } else {
      // 正常状态：选择收益/风险比最高的
      const best = options.sort((a, b) => {
        const scoreA = this.assessBenefit(a.option) - this.assessRisk(a.option) * 0.5;
        const scoreB = this.assessBenefit(b.option) - this.assessRisk(b.option) * 0.5;
        return scoreB - scoreA;
      })[0];
      choice = best.key;
    }
    
    return {
      turn: ctx.turn,
      eventId: event.id,
      choice,
      reasoning: isCritical ? '危急状态，选择最安全选项' : '选择最优收益风险比',
      timestamp: Date.now()
    };
  }
}

// ==========================================
// 3. 探索型玩家
// ==========================================

export class ExplorerStrategy extends BaseStrategy {
  readonly type = 'explorer' as const;
  readonly name = '探索型玩家';
  
  private dOptionCount = 0;
  
  decide(ctx: DecisionContext): AIDecision {
    const { event } = ctx;
    
    if (!event) {
      return {
        turn: ctx.turn,
        choice: null,
        reasoning: '无事件',
        timestamp: Date.now()
      };
    }
    
    const stats = this.getStats(ctx);
    
    // 优先选择D选项（如果可见且不会太危险）
    const dOption = event.options.D;
    if (dOption && stats.insight >= 70 && stats.hpPercent > 0.3) {
      this.dOptionCount++;
      return {
        turn: ctx.turn,
        eventId: event.id,
        choice: 'D',
        reasoning: `探索D选项（已累计${this.dOptionCount}次）`,
        timestamp: Date.now()
      };
    }
    
    // 其次选择能增加灵视的选项
    const options = this.getAvailableOptions(event, stats.insight)
      .filter(o => o.key !== 'D');
    
    if (options.length === 0) {
      return {
        turn: ctx.turn,
        eventId: event.id,
        choice: 'A',
        reasoning: '无可用选项，默认选A',
        timestamp: Date.now()
      };
    }
    
    const bestInsight = options.sort((a, b) => {
      const insightA = a.option.effects.insight || 0;
      const insightB = b.option.effects.insight || 0;
      return insightB - insightA;
    })[0];
    
    return {
      turn: ctx.turn,
      eventId: event.id,
      choice: bestInsight.key,
      reasoning: '优先增加灵视',
      timestamp: Date.now()
    };
  }
}

// ==========================================
// 4. 极限挑战者
// ==========================================

export class ChaosStrategy extends BaseStrategy {
  readonly type = 'chaos' as const;
  readonly name = '极限挑战者';
  
  decide(ctx: DecisionContext): AIDecision {
    const { event } = ctx;
    
    if (!event) {
      return {
        turn: ctx.turn,
        choice: null,
        reasoning: '无事件',
        timestamp: Date.now()
      };
    }
    
    const stats = this.getStats(ctx);
    const options = this.getAvailableOptions(event, stats.insight);
    
    if (options.length === 0) {
      return {
        turn: ctx.turn,
        eventId: event.id,
        choice: 'A',
        timestamp: Date.now()
      };
    }
    
    // 按风险排序，选最高的
    const riskiest = options.sort((a, b) => {
      return this.assessRisk(b.option) - this.assessRisk(a.option);
    })[0];
    
    return {
      turn: ctx.turn,
      eventId: event.id,
      choice: riskiest.key,
      reasoning: '故意选择高风险选项',
      timestamp: Date.now()
    };
  }
}

// ==========================================
// 5. 新手模拟器
// ==========================================

export class NewbieStrategy extends BaseStrategy {
  readonly type = 'newbie' as const;
  readonly name = '新手模拟器';
  
  // 模拟新手的随机延迟和误操作
  private hesitationChance = 0.2;  // 20%概率犹豫（选错）
  
  decide(ctx: DecisionContext): AIDecision {
    const { event } = ctx;
    
    if (!event) {
      return {
        turn: ctx.turn,
        choice: null,
        reasoning: '无事件',
        timestamp: Date.now()
      };
    }
    
    const stats = this.getStats(ctx);
    
    // 新手倾向于选A（通常是最安全的）
    let choice: 'A' | 'B' | 'C' | 'D' = 'A';
    
    // 但有概率随机选（没看明白选项）
    if (Math.random() < this.hesitationChance) {
      const options = this.getAvailableOptions(event, stats.insight)
        .filter(o => o.key !== 'D')
        .map(o => o.key);
      if (options.length > 0) {
        choice = options[Math.floor(Math.random() * options.length)];
      }
    }
    
    // 偶尔误触D（不知道怎么就点到了）
    if (event.options.D && stats.insight >= 70 && Math.random() < 0.05) {
      choice = 'D';
    }
    
    return {
      turn: ctx.turn,
      eventId: event.id,
      choice,
      reasoning: '新手随机选择',
      timestamp: Date.now()
    };
  }
}

// ==========================================
// 策略工厂
// ==========================================

export function createStrategy(type: AIStrategyType): AIStrategy {
  switch (type) {
    case 'random':
      return new RandomStrategy();
    case 'survival':
      return new SurvivalStrategy();
    case 'explorer':
      return new ExplorerStrategy();
    case 'chaos':
      return new ChaosStrategy();
    case 'newbie':
      return new NewbieStrategy();
    default:
      return new RandomStrategy();
  }
}

export const ALL_STRATEGIES: AIStrategyType[] = [
  'random', 'survival', 'explorer', 'chaos', 'newbie'
];
