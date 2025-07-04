/**
 * Handles importing of a project in the welcome modal
 * the logic is mostly duplicated from ManageProjects.tsx
 */

import { ChangeEvent, useRef } from 'react';

import { uploadProjectFile } from '../../../../common/api/db';
import { invalidateAllCaches } from '../../../../common/api/utils';
import Button from '../../../../common/components/buttons/Button';
import { validateProjectFile } from '../../../../common/utils/uploadUtils';

interface ImportProjectButtonProps {
  onFinish: () => void;
}

export default function ImportProjectButton({ onFinish }: ImportProjectButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSelectFile = () => {
    fileInputRef.current?.click();
  };

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target?.files?.[0];
    if (!selectedFile) {
      return;
    }

    try {
      validateProjectFile(selectedFile);
      await uploadProjectFile(selectedFile);
    } catch (error) {
      /** we do not handle errors here */
    } finally {
      await invalidateAllCaches();
      onFinish();
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        style={{ display: 'none' }}
        type='file'
        onChange={handleImport}
        accept='.json'
        data-testid='file-input'
      />

      <Button onClick={handleSelectFile}>Import project</Button>
    </>
  );
}
