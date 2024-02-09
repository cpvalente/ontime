import { ButtonGroup } from '@chakra-ui/react';
import { IoSettingsOutline } from '@react-icons/all-files/io5/IoSettingsOutline';

import TooltipActionBtn from '../../common/components/buttons/TooltipActionBtn';

import style from './FloatingMenu.module.scss';

const buttonStyle = {
  fontSize: '1.25em',
  size: 'md',
  colorScheme: 'white',
  _hover: {
    background: 'rgba(255, 255, 255, 0.10)', // $white-10
  },
  _active: {
    background: 'rgba(255, 255, 255, 0.13)', // $white-13
  },
};

export default function FloatingMenu() {
  return (
    <div className={style.floating}>
      <ButtonGroup isAttached>
        <TooltipActionBtn
          clickHandler={() => undefined}
          {...buttonStyle}
          icon={<IoSettingsOutline />}
          tooltip='About'
          aria-label='About'
        />
        <TooltipActionBtn
          clickHandler={() => undefined}
          {...buttonStyle}
          icon={<IoSettingsOutline />}
          tooltip='About'
          aria-label='About'
        />
        <TooltipActionBtn
          clickHandler={() => undefined}
          {...buttonStyle}
          icon={<IoSettingsOutline />}
          tooltip='About'
          aria-label='About'
        />
      </ButtonGroup>
    </div>
  );
}
