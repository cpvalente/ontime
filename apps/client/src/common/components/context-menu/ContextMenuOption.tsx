import { MenuDivider, MenuItem } from '@chakra-ui/react';

import { OptionWithoutGroup } from './ContextMenu';

export const ContextMenuOption = ({ label, onClick, isDisabled, icon: Icon, withDivider }: OptionWithoutGroup) => (
  <>
    {withDivider && <MenuDivider />}
    <MenuItem icon={<Icon style={{ fontSize: '1rem' }} />} onClick={onClick} isDisabled={isDisabled}>
      {label}
    </MenuItem>
  </>
);
