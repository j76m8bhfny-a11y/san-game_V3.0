import { useMemo } from 'react';
import { RegionID } from '@/types/schema';
import { getVehicleShopConfig, getAvailableVehicles, getAvailableLicenses } from '../config/vehicleShopConfig';

export const useVehicleShop = (region: RegionID) => {
  const config = useMemo(() => getVehicleShopConfig(region), [region]);
  const vehicles = useMemo(() => getAvailableVehicles(region), [region]);
  const licenses = useMemo(() => getAvailableLicenses(region), [region]);

  return {
    config,
    vehicles,
    licenses
  };
};
