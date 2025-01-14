import { Children, cloneElement, forwardRef, ReactElement, ReactNode } from 'react';
import type { BoxProps, InputElementProps } from '@chakra-ui/react';
import { Group, InputElement } from '@chakra-ui/react';

export interface InputGroupProps extends BoxProps {
  startElementProps?: InputElementProps;
  endElementProps?: InputElementProps;
  startElement?: ReactNode;
  endElement?: ReactNode;
  children: ReactElement;
  startOffset?: InputElementProps['paddingStart'];
  endOffset?: InputElementProps['paddingEnd'];
}

export const InputGroup = forwardRef<HTMLDivElement, InputGroupProps>(function InputGroup(props, ref) {
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

  const child = Children.only<ReactElement<InputElementProps>>(children);

  return (
    <Group ref={ref} {...rest}>
      {startElement && (
        <InputElement pointerEvents='none' {...startElementProps}>
          {startElement}
        </InputElement>
      )}
      {cloneElement(child, {
        ...(startElement && {
          ps: `calc(var(--input-height) - ${startOffset})`,
        }),
        ...(endElement && { pe: `calc(var(--input-height) - ${endOffset})` }),
        ...children.props,
      })}
      {endElement && (
        <InputElement placement='end' {...endElementProps}>
          {endElement}
        </InputElement>
      )}
    </Group>
  );
});
