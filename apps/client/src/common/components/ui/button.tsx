import * as React from 'react';
import { Span } from '@chakra-ui/react/box';
import type { ButtonProps as ChakraButtonProps } from '@chakra-ui/react/button';
import { Button as ChakraButton } from '@chakra-ui/react/button';
import { AbsoluteCenter } from '@chakra-ui/react/center';
import { Spinner } from '@chakra-ui/react/spinner';

export interface ButtonProps extends ChakraButtonProps {
  disabled?: boolean;
  loading?: boolean;
  loadingText?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(props, ref) {
  const { loading, disabled, loadingText, children, ...rest } = props;
  return (
    <ChakraButton disabled={loading || disabled} ref={ref} {...rest}>
      {loading && !loadingText ? (
        <>
          <AbsoluteCenter display='inline-flex'>
            <Spinner size='inherit' color='inherit' />
          </AbsoluteCenter>
          <Span opacity={0}>{children}</Span>
        </>
      ) : loading && loadingText ? (
        <>
          <Spinner size='inherit' color='inherit' />
          {loadingText}
        </>
      ) : (
        children
      )}
    </ChakraButton>
  );
});
