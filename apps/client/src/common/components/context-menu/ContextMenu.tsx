import { ReactNode } from 'react';
import { IconType } from 'react-icons';

import { MenuContent, MenuContextTrigger, MenuItemGroup, MenuRoot } from '../ui/menu';

import { ContextMenuOption } from './ContextMenuOption';

export type OptionWithoutGroup = {
  label: string;
  isDisabled?: boolean;
  icon: IconType;
  onClick: () => void;
  withDivider?: boolean;
};

export type OptionWithGroup = {
  label: string;
  group: Omit<OptionWithoutGroup, 'isGroup'>[];
};

export type Option = OptionWithoutGroup | OptionWithGroup;

const isOptionWithGroup = (option: Option): option is OptionWithGroup => 'group' in option;

interface ContextMenuProps {
  options: Option[];
  children: ReactNode;
}

export const ContextMenu = ({ children, options }: ContextMenuProps) => {
  return (
    <MenuRoot lazyMount unmountOnExit>
      <MenuContextTrigger textAlign='left' w='full'>
        {children}
      </MenuContextTrigger>
      <MenuContent>
        {options.map((option) =>
          isOptionWithGroup(option) ? (
            <MenuItemGroup key={option.label} title={option.label}>
              {option.group.map((groupOption) => (
                <ContextMenuOption key={groupOption.label} {...groupOption} />
              ))}
            </MenuItemGroup>
          ) : (
            <ContextMenuOption key={option.label} {...option} />
          ),
        )}
      </MenuContent>
    </MenuRoot>
  );
};
