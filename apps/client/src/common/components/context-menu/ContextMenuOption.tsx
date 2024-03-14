import { Menu } from '@mantine/core';

import { OptionWithoutGroup } from './ContextMenu';

export const ContextMenuOption = ({ label, onClick, isDisabled, icon: Icon, withDivider }: OptionWithoutGroup) => (
  <>
    {withDivider && <Menu.Divider />}
    <Menu.Item leftSection={<Icon />} onClick={onClick} disabled={isDisabled}>
      {label}
    </Menu.Item>
  </>
);
