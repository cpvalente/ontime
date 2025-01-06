import { MenuItem, MenuSeparator } from '../../../components/ui/menu';

import { OptionWithoutGroup } from './ContextMenu';

export const ContextMenuOption = ({ label, onClick, isDisabled, icon: Icon, withDivider }: OptionWithoutGroup) => (
  <>
    {withDivider && <MenuSeparator />}
    <MenuItem onClick={onClick} disabled={isDisabled} value={label}>
      <Icon style={{ fontSize: '1rem' }} />
      {label}
    </MenuItem>
  </>
);
