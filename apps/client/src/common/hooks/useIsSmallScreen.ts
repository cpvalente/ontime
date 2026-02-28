import { useViewportSize } from '@mantine/hooks';
import { useMemo } from 'react';

export function useIsSmallScreen(): boolean {
  const { width } = useViewportSize();

  return useMemo(() => width < 1300, [width]);
}
