import { forwardRef } from 'react';
import { Group } from '@chakra-ui/react/group';
import { PinInput as ChakraPinInput } from '@chakra-ui/react/pin-input';

export interface PinInputProps extends ChakraPinInput.RootProps {
  rootRef?: React.Ref<HTMLDivElement>;
  count?: number;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
  attached?: boolean;
}

export const PinInput = forwardRef<HTMLInputElement, PinInputProps>(function PinInput(props, ref) {
  const { count = 4, inputProps, rootRef, attached, ...rest } = props;
  return (
    <ChakraPinInput.Root ref={rootRef} {...rest}>
      <ChakraPinInput.HiddenInput ref={ref} {...inputProps} />
      <ChakraPinInput.Control>
        <Group attached={attached}>
          {Array.from({ length: count }).map((_, index) => (
            <ChakraPinInput.Input key={index} index={index} />
          ))}
        </Group>
      </ChakraPinInput.Control>
    </ChakraPinInput.Root>
  );
});
