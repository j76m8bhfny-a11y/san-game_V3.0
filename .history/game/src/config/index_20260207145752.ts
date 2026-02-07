/**
 * 统一配置加载器
 *
 * 集中管理所有游戏配置文件，便于维护和测试
 * 所有配置文件都从此处导出，避免在组件中硬编码路径
 */

// ==================== 规则配置 ====================

import bankRules from '@/assets/data/rules/bankRules.json';
import billRules from '@/assets/data/rules/billRules.json';
import endingRules from '@/assets/data/rules/ending_rules.json';
import faithRules from '@/assets/data/rules/faithRules.json';
import housingRules from '@/assets/data/rules/housingRules.json';
import jobRules from '@/assets/data/rules/jobRules.json';
import marketRules from '@/assets/data/rules/marketRules.json';
import medicalRules from '@/assets/data/rules/medicalRules.json';
import narrativeRules from '@/assets/data/rules/narrative_rules.json';
import prisonRules from '@/assets/data/rules/prisonRules.json';
import shopRules from '@/assets/data/rules/shopRules.json';
import systemRules from '@/assets/data/config/system_rules.json';
import vitalityRules from '@/assets/data/rules/vitalityRules.json';

// ==================== 数据配置 ====================

import billsData from '@/assets/data/bills.json';
import classesData from '@/assets/data/classes.json';
import diseasesData from '@/assets/data/diseases.json';
import endingsData from '@/assets/data/endings.json';
import eventsData from '@/assets/data/events.json';
import faithsData from '@/assets/data/faiths.json';
import globalData from '@/assets/data/global.json';
import hospitalServicesData from '@/assets/data/hospital_services.json';
import housingData from '@/assets/data/housing.json';
import insuranceData from '@/assets/data/insurance.json';
import itemsData from '@/assets/data/items.json';
import jobsData from '@/assets/data/jobs.json';
import loansData from '@/assets/data/loans.json';
import newsData from '@/assets/data/news.json';

// ==================== 配置导出 ====================

/**
 * 规则配置集合
 */
export const Rules = {
  bank: bankRules,
  bill: billRules,
  ending: endingRules,
  faith: faithRules,
  housing: housingRules,
  job: jobRules,
  market: marketRules,
  medical: medicalRules,
  narrative: narrativeRules,
  prison: prisonRules,
  shop: shopRules,
  system: systemRules,
  vitality: vitalityRules,
} as const;

/**
 * 数据配置集合
 */
export const Data = {
  bills: billsData,
  classes: classesData,
  diseases: diseasesData,
  endings: endingsData,
  events: eventsData,
  faiths: faithsData,
  global: globalData,
  hospitalServices: hospitalServicesData,
  housing: housingData,
  insurance: insuranceData,
  items: itemsData,
  jobs: jobsData,
  loans: loansData,
  news: newsData,
} as const;

/**
 * 所有配置的统一导出
 */
export const Config = {
  ...Rules,
  ...Data,
} as const;

// ==================== 类型定义 ====================

export type RuleKey = keyof typeof Rules;
export type DataKey = keyof typeof Data;
export type ConfigKey = keyof typeof Config;

// ==================== 工具函数 ====================

/**
 * 获取指定规则配置
 */
export function getRule<K extends RuleKey>(key: K): typeof Rules[K] {
  return Rules[key];
}

/**
 * 获取指定数据配置
 */
export function getData<K extends DataKey>(key: K): typeof Data[K] {
  return Data[key];
}

/**
 * 获取任意配置
 */
export function getConfig<K extends ConfigKey>(key: K): typeof Config[K] {
  return Config[key];
}
