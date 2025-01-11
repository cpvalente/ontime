import { useCallback, useState } from 'react';
import { useInsertionEffect, useRef } from 'react';

//copy from https://github.com/chakra-ui/chakra-ui/blob/main/packages/react/src/hooks/use-disclosure.ts

/**
 * This hook is user-land implementation of the experimental `useEffectEvent` hook.
 * React docs: https://react.dev/learn/separating-events-from-effects#declaring-an-effect-event
 */
export function useCallbackRef<Args extends unknown[], Return>(
  callback: ((...args: Args) => Return) | undefined,
  deps: React.DependencyList = [],
) {
  const callbackRef = useRef<typeof callback>(() => {
    throw new Error('Cannot call an event handler while rendering.');
  });

  useInsertionEffect(() => {
    callbackRef.current = callback;
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useCallback((...args: Args) => callbackRef.current?.(...args), deps);
}

export interface UseDisclosureProps {
  open?: boolean;
  defaultOpen?: boolean;
  onClose?(): void;
  onOpen?(): void;
  id?: string;
}

/**
 * `useDisclosure` is a custom hook used to help handle common open, close, or toggle scenarios.
 * It can be used to control feedback component such as `Modal`, `AlertDialog`, `Drawer`, etc.
 *
 * @see Docs https://chakra-ui.com/docs/hooks/use-disclosure
 */
export function useDisclosure(props: UseDisclosureProps = {}) {
  const { onClose: onCloseProp, onOpen: onOpenProp, open: openProp } = props;

  const handleOpen = useCallbackRef(onOpenProp);
  const handleClose = useCallbackRef(onCloseProp);

  const [openState, setopen] = useState(props.defaultOpen || false);

  const open = openProp !== undefined ? openProp : openState;

  const isControlled = openProp !== undefined;

  const onClose = useCallback(() => {
    if (!isControlled) {
      setopen(false);
    }
    handleClose?.();
  }, [isControlled, handleClose]);

  const onOpen = useCallback(() => {
    if (!isControlled) {
      setopen(true);
    }
    handleOpen?.();
  }, [isControlled, handleOpen]);

  const onToggle = useCallback(() => {
    if (open) {
      onClose();
    } else {
      onOpen();
    }
  }, [open, onOpen, onClose]);

  return {
    open,
    onOpen,
    onClose,
    onToggle,
  };
}

export type UseDisclosureReturn = ReturnType<typeof useDisclosure>;
