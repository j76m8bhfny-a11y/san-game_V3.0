/**
 * Store 类型安全工具
 * 用于统一 Zustand Store 的 set 调用类型
 */

import { GameState } from './schema';
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
  SystemSlice;

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
