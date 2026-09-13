import ProtectRoute from '../../common/components/protect-route/ProtectRoute';
import { EditableRundownScopeProvider } from '../../common/context/EditableRundownScopeProvider';
import Operator from './Operator';

export default function OperatorExport() {
  return (
    <ProtectRoute permission='operator'>
      <EditableRundownScopeProvider rundownId={null}>
        <Operator />
      </EditableRundownScopeProvider>
    </ProtectRoute>
  );
}
