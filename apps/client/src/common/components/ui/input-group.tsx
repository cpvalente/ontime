import * as React from 'react';
import type { BoxProps, InputElementProps } from '@chakra-ui/react';
import { Group, InputElement } from '@chakra-ui/react';

export interface InputGroupProps extends BoxProps {
  startElementProps?: InputElementProps;
  endElementProps?: InputElementProps;
  startElement?: React.ReactNode;
  endElement?: React.ReactNode;
  children: React.ReactElement;
  startOffset?: InputElementProps['paddingStart'];
  endOffset?: InputElementProps['paddingEnd'];
}

export const InputGroup = React.forwardRef<HTMLDivElement, InputGroupProps>(function InputGroup(props, ref) {
  const {
    startElement,
    startElementProps,
    endElement,
    endElementProps,
    children,
    startOffset = '6px',
    endOffset = '6px',
    ...rest
  } = props;

  const child = React.Children.only<React.ReactElement<InputElementProps>>(children);

  return (
    <Group ref={ref} {...rest}>
      {startElement && (
        <InputElement pointerEvents='none' {...startElementProps} padding={0}>
          {startElement}
        </InputElement>
      )}
      {React.cloneElement(child, {
        ...(startElement && {
          ps: `calc(var(--input-height) - ${startOffset})`,
        }),
        ...(endElement && { pe: `calc(var(--input-height) - ${endOffset})` }),
        ...children.props,
      })}
      {endElement && (
        <InputElement placement='end' {...endElementProps} padding={0}>
          {endElement}
        </InputElement>
      )}
    </Group>
  );
});
