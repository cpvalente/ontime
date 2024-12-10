import ProtectRoute from '../../common/components/protect-route/ProtectRoute';
import ViewParamsEditor from '../../common/components/view-params-editor/ViewParamsEditor';

import { cuesheetOptions, persistParams } from './cuesheet.options';
import CuesheetPage from './CuesheetPage';

export default function ProtectedCuesheet() {
  return (
    <ProtectRoute permission='operator'>
      <ViewParamsEditor viewOptions={cuesheetOptions} onSubmitCb={persistParams} />
      <CuesheetPage />
    </ProtectRoute>
  );
}
