import ProtectRoute from '../../common/components/protect-route/ProtectRoute';

import CuesheetWrapper from './CuesheetWrapper';

export default function ProtectedCuesheet() {
  return (
    <ProtectRoute permission='operator'>
      <CuesheetWrapper />
    </ProtectRoute>
  );
}
