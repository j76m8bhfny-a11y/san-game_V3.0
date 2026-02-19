/**
 * Store 类型安全工具
 * 用于统一 Zustand Store 的 set 调用类型
 */

import { GameState, RegionID } from './schema';
import { UISlice } from '../store/slices/createUISlice';
import { VitalitySlice } from '../store/slices/createVitalitySlice';
import { BankSlice } from '../store/slices/createBankSlice';
import { GameSlice } from '../store/slices/createGameSlice';
import { PlayerSlice } from '../store/slices/createPlayerSlice';
import { HousingSlice } from '../store/slices/createHousingSlice';
import { JobSlice } from '../store/slices/createJobSlice';
import { ShopSlice } from '../store/slices/createShopSlice';
import { FaithSlice } from '../store/slices/createFaithSlice';
import { PrisonSlice } from '../store/slices/createPrisonSlice';
import { CryptoSlice } from '../store/slices/createCryptoSlice';
import { SystemSlice } from '../store/slices/createSystemSlice';
import { InsuranceSlice } from '../store/slices/createInsuranceSlice';
import { VehicleSlice } from '../store/slices/createVehicleSlice';

/**
 * 完整的 Store 状态类型
 */
export type StoreState = GameState &
  UISlice &
  VitalitySlice &
  BankSlice &
  GameSlice &
  PlayerSlice &
  HousingSlice &
  JobSlice &
  ShopSlice &
  FaithSlice &
  PrisonSlice &
  CryptoSlice &
  SystemSlice &
  InsuranceSlice &
  VehicleSlice &
  {
    // 🍖 饮食系统状态
    dietState: {
      junkFoodPoints: number;
      healthyPoints: number;
      consecutiveJunkDays: number;
      consecutiveHealthyDays: number;
      sodiumIntake: number;
      sugarIntake: number;
      redMeatPoints: number;
      noFreshFoodDays: number;
    };
    activeBuffs: Array<{
      id: string;
      name: string;
      endTurn: number;
      effects: Record<string, any>;
    }>;
    // 🏪 商店库存系统（回合制刷新）
    shopInventory: Record<RegionID, string[]>; // 每个区域当前可购买的物品ID列表
    // 🚗 车辆购买区域记录（限制只能在购买区域卖车）
    vehiclePurchaseRegion: RegionID | null;
  };

/**
 * 类型安全的 set 函数类型
 */
export type SetState<T> = (
  partial: T | Partial<T> | ((state: T) => T | Partial<T>),
  replace?: boolean
) => void;

/**
 * 获取状态函数类型
 */
export type GetState<T> = () => T;
