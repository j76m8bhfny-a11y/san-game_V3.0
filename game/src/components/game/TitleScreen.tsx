import React from 'react';

interface TitleScreenProps {
  onStart: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStart,
}) => {
  return <div>[TitleScreen]</div>;
};
