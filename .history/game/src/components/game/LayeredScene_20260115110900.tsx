import React from 'react';

interface LayeredSceneProps {
  bgImage: string;
  eventImage: string;
  playerImage: string;
  isGlitch: boolean;
}

export const LayeredScene: React.FC<LayeredSceneProps> = ({
  bgImage,
  eventImage,
  playerImage,
  isGlitch,
}) => {
  return <div>[LayeredScene]</div>;
};
