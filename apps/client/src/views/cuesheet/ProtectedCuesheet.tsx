import ProtectRoute from '../../common/components/protect-route/ProtectRoute';
import CuesheetPage from './CuesheetPage';

export default function ProtectedCuesheet() {
  return (
    <ProtectRoute permission='operator'>
      <CuesheetPage />
    </ProtectRoute>
  );
}
