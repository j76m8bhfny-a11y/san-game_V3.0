/**
 * narrative_rules.json 类型定义
 * 提供完整的 TypeScript 类型支持
 */

// ===== 燃烧效果配置 =====
export interface BurningEffectConfig {
  description?: string;
  enabled: boolean;
  animationDuration: number;
  ashOpacity: number;
  grayscaleIntensity: number;
  scaleReduction: number;
  whisperDuration: number;
  whisperDelay: number;
  ghostWhispers: Record<string, string>;
}

// ===== 回合过渡配置 =====
export interface TurnTransitionTiming {
  eyeCloseDuration: number;
  darkScreenDuration: number;
  calendarFlipDuration: number;
  eyeOpenDuration: number;
  totalDuration?: number;
}

export interface TurnTransitionSounds {
  eyeClose: string;
  eyeOpen: string;
  calendarFlip: string;
  typewriter: string;
}

export interface TurnTransitionVisual {
  darkScreenBg: string;
  textColor: string;
  textSize: string;
  typewriterSpeed: number;
  glitchIntensity: number;
}

export interface TurnTransitionConfig {
  description?: string;
  timings: TurnTransitionTiming;
  sounds: TurnTransitionSounds;
  visual: TurnTransitionVisual;
}

// ===== 黑色幽默文案 =====
export interface CriticalCondition {
  id: string;
  conditions: {
    hp?: { max?: number; min?: number };
    gold?: { max?: number; min?: number };
    insight?: { max?: number; min?: number };
  };
  lines: string[];
}

export interface DarkHumorLinesConfig {
  description?: string;
  matchingPriority: string[];
  critical: CriticalCondition[];
  classSpecific: Record<string, string[]>;
  hp: Record<string, string[]>;
  insight: Record<string, string[]>;
  gold: Record<string, string[]>;
  hunger: {
    high: string[];
    medium: string[];
    low: string[];
  };
  disease: {
    has: string[];
    none: string[];
  };
  debt: {
    has: string[];
    none: string[];
  };
  survival: string[];
}

// ===== 玩家立绘配置 =====
export interface ClassSpriteConfig {
  normal: string;
  highInsight?: string;
  altText?: string;
}

export interface PlayerSpritesConfig {
  description?: string;
  enabled: boolean;
  highInsightThreshold: number;
  byClass: Record<string, ClassSpriteConfig>;
  default: string;
  transitionDuration?: number;
}

// ===== 开场漫画配置 =====
export interface ComicBubble {
  type: 'narration' | 'dialogue' | 'thought';
  text: string;
  position: 'top' | 'center' | 'bottom' | 'left' | 'right';
  speaker?: string;
  delay?: number;
}

export interface ComicPanel {
  id: string;
  background: string;
  caption?: string;
  bubbles: ComicBubble[];
  duration: number;
}

export interface IntroComicStyle {
  fontFamily: string;
  borderStyle?: string;
  colorScheme?: string;
  panelTransition?: string;
  transitionDuration?: number;
}

export interface IntroComicSounds {
  pageTurn: string;
  bubblePop: string;
}

export interface IntroComicConfig {
  description?: string;
  enabled: boolean;
  panels: ComicPanel[];
  finalText: string;
  startButton?: string;
  style: IntroComicStyle;
  sounds: IntroComicSounds;
}

// ===== 阶级变化配置 =====
export interface ClassChangeVisualConfig {
  bgGradient: string;
  accentColor: string;
  icon: string;
  animation: 'rise' | 'fall';
  sound: string;
}

export interface ClassChangeDescConfig {
  title: string;
  desc: string;
  flavor: string;
}

export interface ClassChangeConfig {
  description?: string;
  enabled?: boolean;
  visual: {
    upgrade: ClassChangeVisualConfig;
    downgrade: ClassChangeVisualConfig;
  };
  titles: {
    upgrade: string;
    downgrade: string;
  };
  descriptions: Record<string, string | ClassChangeDescConfig>;
  mechanicsHint: Record<string, string>;
  defaultTemplate: string;
}

// ===== 叙事规则根配置 =====
export interface NarrativeRules {
  burningEffect: BurningEffectConfig;
  turnTransition: TurnTransitionConfig;
  darkHumorLines: DarkHumorLinesConfig;
  playerSprites: PlayerSpritesConfig;
  introComic: IntroComicConfig;
  classChange: ClassChangeConfig;
}

// ===== 类型守卫函数 =====
export function isNarrativeRules(obj: unknown): obj is NarrativeRules {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'burningEffect' in obj &&
    'turnTransition' in obj &&
    'darkHumorLines' in obj &&
    'playerSprites' in obj &&
    'introComic' in obj &&
    'classChange' in obj
  );
}
