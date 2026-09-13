import { useQuery } from '@tanstack/react-query';

import { getAutomationUsage } from '../api/automation';
import { AUTOMATION } from '../api/constants';

export default function useAutomationUsage() {
  return useQuery({
    queryKey: [...AUTOMATION, 'usage'],
    queryFn: ({ signal }) => getAutomationUsage({ signal }),
  });
}
