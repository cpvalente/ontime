import { ChangeEvent, useRef, useState } from 'react';

import { uploadProjectFile } from '../api/db';
import { invalidateAllCaches, maybeAxiosError } from '../api/utils';
import { validateProjectFile } from '../utils/uploadUtils';

interface ProjectImportOptions {
  /** called once the imported project is loaded */
  onImported?: () => void;
  onError: (message: string) => void;
}

/**
 * Imports a project file picked through a hidden file input
 */
export function useProjectImport({ onImported, onError }: ProjectImportOptions) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);

  const selectFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    // the input only reports changes, clearing it allows picking the same file after a failure
    event.target.value = '';
    if (!selectedFile) {
      return;
    }

    try {
      validateProjectFile(selectedFile);
    } catch (error) {
      // nothing reached the server
      onError(`Error uploading file: ${maybeAxiosError(error)}`);
      return;
    }

    setIsImporting(true);
    try {
      await uploadProjectFile(selectedFile);
      // before the refresh, so a dialog closes without waiting on slow queries
      onImported?.();
    } catch (error) {
      onError(`Error uploading file: ${maybeAxiosError(error)}`);
    } finally {
      // a failed import may still have changed the projects
      await invalidateAllCaches();
      setIsImporting(false);
    }
  };

  /** props for the hidden file input, which the caller renders */
  const inputProps = {
    ref: fileInputRef,
    type: 'file',
    accept: '.json',
    style: { display: 'none' },
    onChange: handleFileChange,
    'data-testid': 'file-input',
  } as const;

  return { inputProps, selectFile, isImporting };
}
