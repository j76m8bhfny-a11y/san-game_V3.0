import vehiclesData from '@/assets/data/vehicles.json';
import licensesData from '@/assets/data/licenses.json';
import shopData from '@/assets/data/vehicleShops.json';
import { RegionID, PlayerClass } from '@/types/schema';

// 车辆配置类型
export interface VehicleConfig {
  id: string;
  nameKey: string;
  price: number;
  sellPriceRate: { slums?: number; default: number };
  regions: RegionID[];
  requiredClass: PlayerClass;
  effects?: Record<string, number>;
  tags: string[];
  loanProductId?: string;
  creditScoreRequired?: number;
  restrictions?: {
    blockedRegions: RegionID[];
    warningKey: string;
  };
  billTriggers?: {
    breakdownChance: number;
    breakdownBillId: string;
  };
}

// 驾照配置类型
export interface LicenseConfig {
  id: string;
  nameKey: string;
  type: 'FAKE' | 'VALID' | 'ELITE';
  price: number;
  regions: RegionID[];
  tags: string[];
  waitTurns?: number;
  policeCheck?: {
    detectChance: number;
    failureBillId: string;
  };
}

// 车店UI文本配置
export interface VehicleShopUIText {
  buyTitleKey: string;
  buySubtitleKey?: string;
  sellTitleKey: string;
  sellDescKey?: string;
  licenseTitleKey: string;
  licenseSubtitleKey?: string;
  dmvTitleKey?: string;
  dmvSubtitleKey?: string;
  leaseTitleKey?: string;
  tradeInTitleKey?: string;
  conciergeTitleKey?: string;
  eliteLicenseTitleKey?: string;
}

// 车店面板配置
export interface VehicleShopPanel {
  titleKey: string;
  sections: string[];
}

// 车店配置类型
export interface VehicleShopConfig {
  id: string;
  nameKey: string;
  theme: string;
  layout: string;
  leftPanel: VehicleShopPanel;
  rightPanel: VehicleShopPanel;
  uiText: VehicleShopUIText;
  features?: {
    leaseEnabled?: boolean;
    creditCheck?: boolean;
    tradeInEnabled?: boolean;
    cashOnly?: boolean;
    conciergeService?: boolean;
  };
  visual: {
    exteriorImage: string;
    interiorBg: string;
    accentColor: string;
  };
}

// 获取车店配置
export const getVehicleShopConfig = (region: RegionID): VehicleShopConfig => {
  const config = (shopData as unknown as Record<string, VehicleShopConfig>)[region];
  if (!config) {
    throw new Error(`No vehicle shop config found for region: ${region}`);
  }
  return config;
};

// 获取车辆配置
export const getVehicleConfig = (vehicleId: string): VehicleConfig | undefined => {
  return (vehiclesData as VehicleConfig[]).find(v => v.id === vehicleId);
};

// 获取驾照配置
export const getLicenseConfig = (licenseId: string): LicenseConfig | undefined => {
  return (licensesData as LicenseConfig[]).find(l => l.id === licenseId);
};

// 获取区域可用车辆
export const getAvailableVehicles = (region: RegionID): VehicleConfig[] => {
  return (vehiclesData as VehicleConfig[]).filter(v => 
    v.regions.includes(region)
  );
};

// 获取区域可用驾照
export const getAvailableLicenses = (region: RegionID): LicenseConfig[] => {
  return (licensesData as LicenseConfig[]).filter(l => 
    l.regions.includes(region)
  );
};

// 获取车辆售价（根据区域）
export const getVehicleSellPrice = (
  vehicleId: string, 
  region: RegionID
): number => {
  const vehicle = getVehicleConfig(vehicleId);
  if (!vehicle) return 0;
  
  const rate = region === RegionID.Slums 
    ? (vehicle.sellPriceRate.slums || vehicle.sellPriceRate.default)
    : vehicle.sellPriceRate.default;
    
  return Math.floor(vehicle.price * rate);
};

// 检查是否拥有车辆
export const hasVehicle = (inventory: string[]): boolean => {
  return inventory.some(id => id.startsWith('CAR_') || id === 'KEY_CAR');
};

// ✅ 检查是否拥有车辆或租赁车辆
export const hasVehicleOrLease = (inventory: string[], activeLease: any | null): boolean => {
  const hasOwnedVehicle = inventory.some(id => id.startsWith('CAR_') || id === 'KEY_CAR');
  const hasLeasedVehicle = !!activeLease;
  return hasOwnedVehicle || hasLeasedVehicle;
};

// 获取当前车辆ID
export const getCurrentVehicle = (inventory: string[]): string | null => {
  return inventory.find(id => id.startsWith('CAR_') || id === 'KEY_CAR') || null;
};

// 检查是否拥有驾照
export const hasLicense = (inventory: string[]): boolean => {
  return inventory.some(id => id.startsWith('LICENSE_'));
};

// 获取驾照类型
export const getLicenseType = (inventory: string[]): 'FAKE' | 'VALID' | 'ELITE' | null => {
  if (inventory.includes('LICENSE_ELITE')) return 'ELITE';
  if (inventory.includes('LICENSE_VALID')) return 'VALID';
  if (inventory.includes('LICENSE_FAKE')) return 'FAKE';
  return null;
};

// 检查是否有有效驾照（非假证）
export const hasValidLicense = (inventory: string[]): boolean => {
  return inventory.includes('LICENSE_VALID') || inventory.includes('LICENSE_ELITE');
};

// 检查是否免疫警察检查
export const isPoliceImmune = (inventory: string[]): boolean => {
  // 拥有豁免驾照
  if (inventory.includes('LICENSE_ELITE')) return true;
  // 拥有防弹豪车
  if (inventory.includes('CAR_LUXURY')) return true;
  return false;
};

// ✅ 计算置换价格（比普通售价高5%）
export const calculateTradeInValue = (
  vehicleId: string,
  region: RegionID
): number => {
  const vehicle = getVehicleConfig(vehicleId);
  if (!vehicle) return 0;
  
  // 基础售价
  const baseRate = vehicle.sellPriceRate?.default || 0.6;
  const regionRate = region === RegionID.Slums 
    ? (vehicle.sellPriceRate?.slums || baseRate)
    : baseRate;
  
  // 置换加成 5%
  const tradeInModifier = 0.05;
  const finalRate = regionRate + tradeInModifier;
  
  return Math.floor(vehicle.price * finalRate);
};
