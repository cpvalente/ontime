import ProtectRoute from '../../common/components/protect-route/ProtectRoute';

import Editor from './Editor';

export default function ProtectedEditor() {
  return (
    <ProtectRoute permission='editor'>
      <Editor />
    </ProtectRoute>
  );
}
