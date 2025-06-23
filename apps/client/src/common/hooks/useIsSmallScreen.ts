import { useMemo } from 'react';
import { useViewportSize } from '@mantine/hooks';

export function useIsSmallScreen(): boolean {
  const { width } = useViewportSize();

  return useMemo(() => width < 1300, [width]);
}
