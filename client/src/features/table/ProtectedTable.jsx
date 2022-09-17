import ProtectRoute from '../../common/components/protectRoute/ProtectRoute';
import { TableSettingsProvider } from '../../common/context/TableSettingsContext';

import TableWrapper from './TableWrapper';

export default function ProtectedTable() {
  return (
    <ProtectRoute>
      <TableSettingsProvider>
        <TableWrapper />
      </TableSettingsProvider>
    </ProtectRoute>
  );
}