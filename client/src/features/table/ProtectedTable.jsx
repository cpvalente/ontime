import React from 'react';
import ProtectRoute from '../../common/components/protectRoute/ProtectRoute';
import TableWrapper from './TableWrapper';
import { TableSettingsProvider } from '../../app/context/TableSettingsContext';

export default function ProtectedTable() {
  return (
    <ProtectRoute>
      <TableSettingsProvider>
        <TableWrapper />
      </TableSettingsProvider>
    </ProtectRoute>
  );
}