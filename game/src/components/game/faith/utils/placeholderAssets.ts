/**
 * 信仰系统图片占位资源
 * 使用内联 SVG 和数据 URI 作为临时占位，避免 404 错误
 */

import type { CSSProperties } from 'react';

// 纯色渐变背景作为场景占位
export const placeholderBackgrounds = {
  // Downtown - 神秘暗金色调
  downtown_lodge_exterior: `linear-gradient(135deg, #0a0a0a 0%, #1a1209 50%, #0f0a05 100%)`,
  downtown_lodge_interior: `linear-gradient(180deg, #050505 0%, #1a120b 100%)`,
  
  // Rust Belt - 工业紫红调
  rust_church_exterior: `linear-gradient(135deg, #1a0a1a 0%, #2d1b2e 50%, #1a0f1a 100%)`,
  rust_church_interior: `linear-gradient(180deg, #0a0a0a 0%, #1a0a0a 100%)`,
  
  // Slums - 肮脏橙褐调
  slums_shrine_exterior: `linear-gradient(135deg, #0f0a05 0%, #2a1f15 50%, #1a120a 100%)`,
  slums_shrine_interior: `linear-gradient(180deg, #0a0805 0%, #1a1510 100%)`,
  
  // Suburbs - 现代蓝白调
  suburbs_church_exterior: `linear-gradient(135deg, #f0f4f8 0%, #e2e8f0 50%, #cbd5e0 100%)`,
  suburbs_church_interior: `linear-gradient(180deg, #f7fafc 0%, #edf2f7 100%)`,
};

// UI 图标占位（使用 Emoji + CSS 样式替代）
export const placeholderIcons = {
  handshake: '🤝',
  donation_bag: '🛍️',
  broken_statue: '🗿',
  rat: '🐀',
  graffiti_eye: '👁️',
  logo_small: '✝️',
  seminar_banner: '📊',
};

// 特效纹理占位（使用 CSS 渐变）
export const placeholderEffects = {
  scanlines: `repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0,0,0,0.1) 2px,
    rgba(0,0,0,0.1) 4px
  )`,
  sparkles: `radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)`,
  dust_particles: `radial-gradient(circle, rgba(255,200,150,0.3) 1px, transparent 2px)`,
};

/**
 * 获取背景样式
 */
export const getBackgroundStyle = (name: keyof typeof placeholderBackgrounds): CSSProperties => ({
  background: placeholderBackgrounds[name],
});

/**
 * 获取特效覆盖层样式
 */
export const getEffectStyle = (name: keyof typeof placeholderEffects): CSSProperties => ({
  backgroundImage: placeholderEffects[name],
  backgroundSize: name === 'sparkles' ? '20px 20px' : name === 'dust_particles' ? '30px 30px' : '100% 4px',
});
