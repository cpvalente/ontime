import { useDialogStore } from '../../../common/stores/dialogStore';
import Welcome from './Welcome';

export default function WelcomePlacement() {
  const showDialog = useDialogStore((state) => state.showDialog);
  const clearDialog = useDialogStore((state) => state.clearDialog);

  if (!showDialog) {
    return null;
  }

  return <Welcome onClose={clearDialog} />;
}
