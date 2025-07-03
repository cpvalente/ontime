import { useMemo } from 'react';
import { useViewportSize } from '@mantine/hooks';

export function useIsMobileScreen(): boolean {
  const { width } = useViewportSize();

  return useMemo(() => width < 800, [width]);
}
