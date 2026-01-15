import React from 'react';
import { GameEvent } from '@/types/schema';

interface MessageWindowProps {
  event: GameEvent;
  onOptionSelect: (optionId: string) => void;
}

export const MessageWindow: React.FC<MessageWindowProps> = ({
  event,
  onOptionSelect,
}) => {
  return <div>[MessageWindow]</div>;
};
