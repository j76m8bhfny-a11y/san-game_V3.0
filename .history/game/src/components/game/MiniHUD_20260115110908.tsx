import React from 'react';

interface MiniHUDProps {
  day: number;
  hp: number;
  san: number;
  gold: number;
  onOpenShop: () => void;
  onOpenArchive: () => void;
  onOpenMenu: () => void;
}

export const MiniHUD: React.FC<MiniHUDProps> = ({
  day,
  hp,
  san,
  gold,
  onOpenShop,
  onOpenArchive,
  onOpenMenu,
}) => {
  return <div>[MiniHUD]</div>;
};
