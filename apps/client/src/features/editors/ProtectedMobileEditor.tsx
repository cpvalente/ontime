import ProtectRoute from '../../common/components/protect-route/ProtectRoute';

import MobileEditor from './MobileEditor';

export default function ProtectedMobileEditor() {
  return (
    <ProtectRoute permission='editor'>
      <MobileEditor />
    </ProtectRoute>
  );
}
