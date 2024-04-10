import { extendTheme } from '@chakra-ui/react';

import { ontimeAlertOnDark, ontimeRedAlertOnDark } from './OntimeAlert';
import {
  ontimeButtonFilled,
  ontimeButtonGhosted,
  ontimeButtonGhostedWhite,
  ontimeButtonOutlined,
  ontimeButtonSubtle,
  ontimeButtonSubtleWhite,
} from './ontimeButton';
import { ontimeCheckboxOnDark } from './ontimeCheckbox';
import { ontimeDrawer } from './ontimeDrawer';
import { ontimeEditable } from './ontimeEditable';
import { ontimeMenuOnDark } from './ontimeMenu';
import { ontimeModal } from './ontimeModal';
import { ontimeBlockRadio } from './ontimeRadio';
import { ontimeSelect } from './ontimeSelect';
import { ontimeSwitch } from './ontimeSwitch';
import { ontimeTab } from './ontimeTab';
import {
  ontimeInputFilled,
  ontimeInputGhosted,
  ontimeTextAreaFilled,
  ontimeTextAreaTransparent,
} from './ontimeTextInputs';
import { ontimeTooltip } from './ontimeTooltip';

const theme = extendTheme({
  initialColorMode: 'dark',
  useSystemColorMode: false,
  components: {
    Alert: {
      variants: {
        'ontime-on-dark-info': { ...ontimeAlertOnDark },
        'ontime-transparent-warn': { ...ontimeRedAlertOnDark },
      },
    },
    Button: {
      baseStyle: {
        letterSpacing: '0.3px',
        fontWeight: '400',
        borderRadius: '3px',
      },
      variants: {
        'ontime-filled': { ...ontimeButtonFilled },
        'ontime-outlined': { ...ontimeButtonOutlined },
        'ontime-subtle': { ...ontimeButtonSubtle },
        'ontime-ghosted': { ...ontimeButtonGhosted },
        'ontime-ghosted-white': { ...ontimeButtonGhostedWhite },
        'ontime-subtle-white': { ...ontimeButtonSubtleWhite },
      },
    },
    Checkbox: {
      variants: {
        'ontime-ondark': { ...ontimeCheckboxOnDark },
      },
    },
    Drawer: {
      variants: {
        ontime: { ...ontimeDrawer },
      },
    },
    Editable: {
      variants: {
        ontime: { ...ontimeEditable },
      },
    },
    Input: {
      baseStyle: {
        borderRadius: '3px',
        border: '1px',
      },
      variants: {
        'ontime-filled': { ...ontimeInputFilled },
        'ontime-ghosted': { ...ontimeInputGhosted },
      },
    },
    Menu: {
      variants: {
        'ontime-on-dark': { ...ontimeMenuOnDark },
      },
    },
    Modal: {
      baseStyle: {
        background: 'rgba(0, 0, 0, 0.5)',
      },
      variants: {
        ontime: { ...ontimeModal },
      },
    },
    Radio: {
      variants: {
        'ontime-block': { ...ontimeBlockRadio },
      },
    },
    Tabs: {
      variants: {
        ontime: { ...ontimeTab },
      },
    },
    Textarea: {
      baseStyle: {
        borderRadius: '3px',
      },
      variants: {
        'ontime-filled': { ...ontimeTextAreaFilled },
        'ontime-transparent': { ...ontimeTextAreaTransparent },
      },
    },
    Tooltip: {
      baseStyle: { ...ontimeTooltip },
    },
    Switch: {
      variants: {
        ontime: { ...ontimeSwitch },
      },
    },
    Select: {
      variants: {
        ontime: { ...ontimeSelect },
      },
    },
  },
});

export default theme;
