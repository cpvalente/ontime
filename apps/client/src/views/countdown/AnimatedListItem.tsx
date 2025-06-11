import React from 'react';
import { useListItemAnimation } from './useListItemAnimation'; // Import the new hook

interface AnimatedListItemProps {
  children: React.ReactNode;
  onUnmount: () => void;
  duration?: number;
}

const AnimatedListItem: React.FC<AnimatedListItemProps> = ({ children, onUnmount, duration }) => {
  // Use the hook to get animation props
  const { itemRef, itemStyle } = useListItemAnimation({ onUnmount, duration });

  return (
    <div ref={itemRef} className="animated-list-item" style={itemStyle}>
      {children}
    </div>
  );
};

export default AnimatedListItem;
