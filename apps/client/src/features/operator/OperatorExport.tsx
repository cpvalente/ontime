import ProtectRoute from '../../common/components/protect-route/ProtectRoute';
import { RundownScopeProvider } from '../../common/context/RundownScopeContext';
import Operator from './Operator';

export default function OperatorExport() {
  return (
    <ProtectRoute permission='operator'>
      <RundownScopeProvider rundownId={null}>
        <Operator />
      </RundownScopeProvider>
    </ProtectRoute>
  );
}
