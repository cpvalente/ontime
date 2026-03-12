import { useViewportSize } from '@mantine/hooks';
import { useMemo } from 'react';

export function useIsMobileScreen(): boolean {
  const { width } = useViewportSize();

  return useMemo(() => width < 800, [width]);
}
