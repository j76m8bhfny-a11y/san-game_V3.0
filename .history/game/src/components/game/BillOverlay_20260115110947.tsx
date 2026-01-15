import React from 'react';
import { Bill } from '@/types/schema';

interface BillOverlayProps {
  bill: Bill;
  onPay: () => void;
}

export const BillOverlay: React.FC<BillOverlayProps> = ({
  bill,
  onPay,
}) => {
  return <div>[BillOverlay]</div>;
};
