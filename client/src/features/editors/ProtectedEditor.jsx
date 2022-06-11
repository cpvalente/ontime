import React from 'react';

import ProtectRoute from '../../common/components/protectRoute/ProtectRoute';

import Editor from './Editor';

export default function ProtectedEditor() {
  return (
    <ProtectRoute>
      <Editor />
    </ProtectRoute>
  );
}
