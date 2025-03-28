import ViewNavigationMenu from '../../common/components/navigation-menu/ViewNavigationMenu';
import ProtectRoute from '../../common/components/protect-route/ProtectRoute';

import Operator from './Operator';

export default function OperatorExport() {
  return (
    <ProtectRoute permission='operator'>
      <ViewNavigationMenu isLockable />
      <Operator />
    </ProtectRoute>
  );
}
