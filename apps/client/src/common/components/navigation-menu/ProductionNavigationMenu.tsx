import { memo } from 'react';

import NavigationMenu from './NavigationMenu';

interface ProductionNavigationMenuProps {
  isMenuOpen: boolean;
  onMenuClose: () => void;
}

function ProductionNavigationMenu(props: ProductionNavigationMenuProps) {
  const { isMenuOpen, onMenuClose } = props;

  return <NavigationMenu isOpen={isMenuOpen} onClose={onMenuClose} />;
}

export default memo(ProductionNavigationMenu);
