import React from 'react';

import { TableSettingsProvider } from '../../app/context/TableSettingsContext';
import ProtectRoute from '../../common/components/protectRoute/ProtectRoute';

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