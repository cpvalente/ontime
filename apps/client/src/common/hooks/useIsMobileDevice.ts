import { useOs, useViewportSize } from '@mantine/hooks';
import { useMemo } from 'react';

export function useIsMobileDevice(): boolean {
  const { width } = useViewportSize();
  const os = useOs();

  return useMemo(() => (os === 'ios' || os === 'android') && width < 800, [width, os]);
}
