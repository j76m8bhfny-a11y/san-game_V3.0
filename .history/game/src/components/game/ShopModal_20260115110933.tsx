import React from 'react';
import { Item } from '@/types/schema';

interface ShopModalProps {
  items: Item[];
  gold: number;
  onBuy: (itemId: string) => void;
  onClose: () => void;
}

export const ShopModal: React.FC<ShopModalProps> = ({
  items,
  gold,
  onBuy,
  onClose,
}) => {
  return <div>[ShopModal]</div>;
};
