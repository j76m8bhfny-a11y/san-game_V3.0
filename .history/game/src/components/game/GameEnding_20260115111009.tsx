import React from 'react';

interface GameEndingProps {
  endingId: string;
  onRestart: () => void;
}

export const GameEnding: React.FC<GameEndingProps> = ({
  endingId,
  onRestart,
}) => {
  return <div>[GameEnding]</div>;
};
