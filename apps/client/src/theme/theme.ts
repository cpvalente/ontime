import { extendTheme } from '@chakra-ui/react';

import { ontimeAlertOnDark, ontimeAlertOnLight } from './OntimeAlert';
import {
  ontimeButtonFilled,
  ontimeButtonGhosted,
  ontimeButtonGhostedWhite,
  ontimeButtonOutlined,
  ontimeButtonSubtle,
  ontimeButtonSubtleOnLight,
  ontimeButtonSubtleWhite,
  ontimeGhostOnLight,
} from './ontimeButton';
import { ontimeCheckboxOnDark } from './ontimeCheckbox';
import { ontimeEditable } from './ontimeEditable';
import { ontimeMenuOnDark } from './ontimeMenu';
import { ontimeModal, ontimeSmallModal, ontimeUploadModal } from './ontimeModal';
import { ontimeProgressGray } from './OntimeProgress';
import { ontimeBlockRadio } from './ontimeRadio';
import { ontimeSelect } from './ontimeSelect';
import { lightSwitch, ontimeSwitch } from './ontimeSwitch';
import { ontimeTab } from './ontimeTab';
import {
  ontimeInputFilled,
  ontimeInputFilledOnLight,
  ontimeInputGhosted,
  ontimeTextAreaFilled,
  ontimeTextAreaFilledOnLight,
  ontimeTextAreaTransparent,
} from './ontimeTextInputs';
import { ontimeTooltip } from './ontimeTooltip';

const theme = extendTheme({
  initialColorMode: 'dark',
  useSystemColorMode: false,
  components: {
    Alert: {
      variants: {
        'ontime-on-light-info': { ...ontimeAlertOnLight },
        'ontime-on-dark-info': { ...ontimeAlertOnDark },
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
        'ontime-ghosted': { ...ontimeInputGhosted },
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
        'ontime-upload': { ...ontimeUploadModal },
      },
    },
    Progress: {
      variants: {
        'ontime-on-light': { ...ontimeProgressGray },
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
