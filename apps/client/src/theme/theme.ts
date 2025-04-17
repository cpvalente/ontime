import { extendTheme } from '@chakra-ui/react';
import { createTheme, NativeSelect } from '@mantine/core';

import { ontimeAlertOnDark, ontimeDialog } from './OntimeAlert';
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
import { ontimeBlockRadio, ontimeRadio } from './ontimeRadio';
import { ontimeSwitch } from './ontimeSwitch';
import { ontimeTab } from './ontimeTab';
import {
  ontimeInputFilled,
  ontimeInputGhosted,
  ontimeInputTransparent,
  ontimeTextAreaFilled,
  ontimeTextAreaTransparent,
} from './ontimeTextInputs';
import { ontimeTooltip } from './ontimeTooltip';

import nativeSelect from './_nativeSelect.module.scss';

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
        'ontime-transparent': { ...ontimeInputTransparent },
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
        ontime: { ...ontimeRadio },
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
  },
});

export default theme;

export const mantineTheme = createTheme({
  components: {
    NativeSelect: NativeSelect.extend({
      classNames: {
        input: nativeSelect.input,
        section: nativeSelect.section,
      },
    }),
  },
});
