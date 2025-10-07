import { useMemo } from 'react';
import { useOs, useViewportSize } from '@mantine/hooks';

export function useIsSmallDevice(): boolean {
  const { width } = useViewportSize();
  const os = useOs();

  return useMemo(() => (os === 'ios' || os === 'android') && width < 1300, [width, os]);
}
