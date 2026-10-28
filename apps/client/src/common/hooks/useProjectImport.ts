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

    setIsImporting(true);
    let imported = false;
    try {
      validateProjectFile(selectedFile);
      await uploadProjectFile(selectedFile);
      imported = true;
    } catch (error) {
      onError(`Error uploading file: ${maybeAxiosError(error)}`);
    } finally {
      await invalidateAllCaches();
      setIsImporting(false);
    }

    if (imported) {
      onImported?.();
    }
  };

  return { fileInputRef, selectFile, handleFileChange, isImporting };
}
