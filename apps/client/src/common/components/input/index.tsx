import { chakra } from '@chakra-ui/react';
import { ontimeInputFilled, ontimeInputGhosted, ontimeInputTransparent } from 'theme/ontimeTextInputs';

export const Input = chakra('input', {
  base: {
    borderRadius: '3px',
    border: '1px',
  },
  variants: {
    'ontime-filled': { ...ontimeInputFilled },
    'ontime-ghosted': { ...ontimeInputGhosted },
    'ontime-transparent': { ...ontimeInputTransparent },
  },
});
