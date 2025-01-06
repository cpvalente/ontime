import * as React from 'react';
import { IconButton as ChakraIconButton, IconButtonProps as ChakraIconButtonProps } from '@chakra-ui/react';

interface IconButtonProps extends ChakraIconButtonProps {
  disabled?: boolean;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(props, ref) {
  return <ChakraIconButton ref={ref} {...props} />;
});
