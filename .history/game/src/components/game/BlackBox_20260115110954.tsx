import React from 'react';

interface BlackBoxProps {
  onClose: () => void;
}

export const BlackBox: React.FC<BlackBoxProps> = ({
  onClose,
}) => {
  return <div>[BlackBox]</div>;
};
