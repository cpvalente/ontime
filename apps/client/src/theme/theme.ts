import { extendTheme } from '@chakra-ui/react';

import { ontimeAlertOnLight } from './OntimeAlert';
import {
  ontimeButtonFilled,
  ontimeButtonOutlined,
  ontimeButtonSubtle,
  ontimeButtonSubtleOnLight,
  ontimeButtonSubtleWhite,
  ontimeGhostOnLight,
} from './ontimeButton';
import { ontimeCheckboxOnDark } from './ontimeCheckbox';
import { ontimeEditable } from './ontimeEditable';
import { ontimeMenuOnDark } from './ontimeMenu';
import { ontimeModal, ontimeSmallModal } from './ontimeModal';
import { ontimeBlockRadio } from './ontimeRadio';
import { ontimeSelect } from './ontimeSelect';
import { lightSwitch, ontimeSwitch } from './ontimeSwitch';
import { ontimeTab } from './ontimeTab';
import {
  ontimeInputFilled,
  ontimeInputFilledOnLight,
  ontimeTextAreaFilled,
  ontimeTextAreaFilledOnLight,
} from './ontimeTextInputs';
import { ontimeTooltip } from './ontimeTooltip';

const theme = extendTheme({
  components: {
    Alert: {
      variants: {
        'ontime-on-light-info': { ...ontimeAlertOnLight },
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
        'ontime-subtle-white': { ...ontimeButtonSubtleWhite },
        'ontime-subtle-on-light': { ...ontimeButtonSubtleOnLight },
        'ontime-ghost-on-light': { ...ontimeGhostOnLight },
      },
    },
    Checkbox: {
      variants: {
        'ontime-ondark': { ...ontimeCheckboxOnDark },
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
        'ontime-filled-on-light': { ...ontimeInputFilledOnLight },
      },
    },
    Menu: {
      variants: {
        'ontime-on-dark': { ...ontimeMenuOnDark },
      },
    },
    Modal: {
      variants: {
        ontime: { ...ontimeModal },
        'ontime-small': { ...ontimeSmallModal },
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
        'ontime-filled-on-light': { ...ontimeTextAreaFilledOnLight },
      },
    },
    Tooltip: {
      baseStyle: { ...ontimeTooltip },
    },
    Switch: {
      variants: {
        ontime: { ...ontimeSwitch },
        'ontime-on-light': { ...lightSwitch },
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
