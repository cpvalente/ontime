import { useDialogStore } from '../../../common/stores/dialogStore';
import Welcome from './Welcome';

export default function WelcomePlacement() {
  const showDialog = useDialogStore((state) => state.showDialog);
  const projectStartup = useDialogStore((state) => state.projectStartup);
  const clearDialog = useDialogStore((state) => state.clearDialog);

  if (!showDialog) {
    return null;
  }

  return <Welcome projectStartup={projectStartup} onClose={clearDialog} />;
}
