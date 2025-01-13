import { forwardRef } from 'react';
import { IconButton as ChakraIconButton, IconButtonProps as ChakraIconButtonProps } from '@chakra-ui/react';

interface IconButtonProps extends ChakraIconButtonProps {
  disabled?: boolean;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(props, ref) {
  return <ChakraIconButton ref={ref} {...props} />;
});
