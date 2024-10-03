import { extendTheme } from '@chakra-ui/react';

import { ontimeAlertOnDark, ontimeDialog } from './OntimeAlert';
import {
  ontimeButtonFilled,
  ontimeButtonGhosted,
  ontimeButtonGhostedWhite,
  ontimeButtonOutlined,
  ontimeButtonSubtle,
  ontimeButtonSubtleWhite,
} from './ontimeButton';
import { ontimeCheckboxOnDark, ontimeCheckboxWhite } from './ontimeCheckbox';
import { ontimeDrawer } from './ontimeDrawer';
import { ontimeEditable } from './ontimeEditable';
import { ontimeMenuOnDark } from './ontimeMenu';
import { ontimeModal } from './ontimeModal';
import { ontimeBlockRadio } from './ontimeRadio';
import { ontimeSelect } from './ontimeSelect';
import { ontimeSwitch } from './ontimeSwitch';
import { ontimeTab } from './ontimeTab';
import {
  containerStyles,
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
      },
    },
    AlertDialog: {
      variants: {
        ontime: { ...ontimeDialog },
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
        'ontime-subtle-white': { ...ontimeCheckboxWhite },
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
    Kbd: {
      baseStyle: {
        borderRadius: '2px',
        border: 'none',
        background: '#262626', // $gray-1200
        padding: '0.125rem 0.5rem',
        color: '#f6f6f6', // $ui-white
        fontWeight: 400,
        boxShadow: '0px 0px 3px 0px rgba(0,0,0,0.4)',
        fontSize: 'calc(1rem - 2px)',
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
    Container: {
      'ontime-filled': { ...containerStyles },
      'ontime-transparent': { ...containerStyles },
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
