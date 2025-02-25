import { forwardRef, ReactNode, RefObject } from 'react';
import { Portal, Tooltip as ChakraTooltip } from '@chakra-ui/react';

export interface TooltipProps extends ChakraTooltip.RootProps {
  showArrow?: boolean;
  portalled?: boolean;
  portalRef?: RefObject<HTMLElement>;
  content: ReactNode;
  contentProps?: ChakraTooltip.ContentProps;
  disabled?: boolean;
}

export const Tooltip = forwardRef<HTMLDivElement, TooltipProps>(function Tooltip(props, ref) {
  const {
    showArrow,
    children,
    disabled,
    portalled = true,
    lazyMount = true,
    unmountOnExit = true,
    content,
    contentProps,
    portalRef,
    ...rest
  } = props;

  // eslint-disable-next-line -- we need to return children in Fragment
  if (disabled) return <>{children}</>;

  return (
    <ChakraTooltip.Root lazyMount={lazyMount} unmountOnExit={unmountOnExit} {...rest}>
      <ChakraTooltip.Trigger asChild>{children}</ChakraTooltip.Trigger>
      <Portal disabled={!portalled} container={portalRef}>
        <ChakraTooltip.Positioner>
          <ChakraTooltip.Content ref={ref} {...contentProps}>
            {showArrow && (
              <ChakraTooltip.Arrow>
                <ChakraTooltip.ArrowTip />
              </ChakraTooltip.Arrow>
            )}
            {content}
          </ChakraTooltip.Content>
        </ChakraTooltip.Positioner>
      </Portal>
    </ChakraTooltip.Root>
  );
});
