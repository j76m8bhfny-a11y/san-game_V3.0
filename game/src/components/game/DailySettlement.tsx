import React from 'react';

interface DailySettlementProps {
  data: any;
  onNextDay: () => void;
}

export const DailySettlement: React.FC<DailySettlementProps> = ({
  data,
  onNextDay,
}) => {
  return <div>[DailySettlement]</div>;
};
