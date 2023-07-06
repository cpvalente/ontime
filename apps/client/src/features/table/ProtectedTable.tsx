import ProtectRoute from '../../common/components/protect-route/ProtectRoute';

import TableWrapper from './TableWrapper';

export default function ProtectedTable() {
  return (
    <ProtectRoute permission='operator'>
      <TableWrapper />
    </ProtectRoute>
  );
}
