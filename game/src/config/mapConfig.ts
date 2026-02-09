import { RegionID } from '@/types/schema';

export interface MapRegionConfig {
  id: RegionID;
  name: string;
  description: string;
  // 坐标位置 (百分比 0-100)
  x: number; 
  y: number;
  width: number;
  height: number;
  // 视觉样式
  color: string; // 马克笔颜色
  rotation: number; // 文本倾斜角度
}

export const MAP_CONFIG: Record<RegionID, MapRegionConfig> = {
  [RegionID.Slums]: {
    id: RegionID.Slums,
    name: 'THE SLUMS',
    description: '法外之地 / 混乱源头',
    x: 2, y: 20, width: 22, height: 60,
    color: '#ef4444', // Red
    rotation: -5,
  },
  [RegionID.RustBelt]: {
    id: RegionID.RustBelt,
    name: 'RUST BELT',
    description: '工业废墟 / 劳工营地',
    x: 26, y: 15, width: 22, height: 65,
    color: '#f97316', // Orange
    rotation: 2,
  },
  [RegionID.Suburbs]: {
    id: RegionID.Suburbs,
    name: 'SUBURBS',
    description: '私人领地 / 中产阶级',
    x: 50, y: 10, width: 22, height: 70,
    color: '#3b82f6', // Blue
    rotation: -2,
  },
  [RegionID.Downtown]: {
    id: RegionID.Downtown,
    name: 'DOWNTOWN',
    description: '权力核心 / 金融中心',
    x: 74, y: 5, width: 24, height: 80,
    color: '#eab308', // Gold
    rotation: 5,
  },
};