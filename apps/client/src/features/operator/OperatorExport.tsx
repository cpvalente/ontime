import ProtectRoute from '../../common/components/protect-route/ProtectRoute';
import Operator from './Operator';

export default function OperatorExport() {
  return (
    <ProtectRoute permission='operator'>
      <Operator />
    </ProtectRoute>
  );
}
