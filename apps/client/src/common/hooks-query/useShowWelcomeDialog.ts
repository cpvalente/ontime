import { useQuery } from '@tanstack/react-query';

import { WELCOME_DIALOG } from '../api/constants';
import { getShowWelcomeDialog, postShowWelcomeDialog } from '../api/settings';
import { ontimeQueryClient } from '../queryClient';

/**
 * Whether the welcome dialog shows on the next startup
 * undefined until the server answers, or when it could not be reached
 */
export default function useShowWelcomeDialog() {
  const { data } = useQuery({
    queryKey: WELCOME_DIALOG,
    queryFn: ({ signal }) => getShowWelcomeDialog({ signal }),
  });

  /** @throws if the setting could not be saved */
  const setShowWelcomeDialog = async (show: boolean) => {
    const saved = await postShowWelcomeDialog(show);
    ontimeQueryClient.setQueryData(WELCOME_DIALOG, saved);
  };

  return { showWelcomeDialog: data, setShowWelcomeDialog };
}
