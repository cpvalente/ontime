import { ChangeEvent, useRef, useState } from 'react';
import { Input } from '@chakra-ui/react';

import UploadEntry from './upload-entry/UploadEntry';
import { useUploadModalContextStore } from './uploadModalContext';
import { validateFile } from './uploadUtils';

import style from './UploadModal.module.scss';

export default function UploadFile() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { file, setFile, progress } = useUploadModalContextStore();

  const [errors, setErrors] = useState<string | undefined>();
  const success = false;

  const clearFile = () => {
    setFile(null);
  };

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const fileSelected = event?.target?.files?.[0];
    if (!fileSelected) return;

    const validate = validateFile(fileSelected);
    setErrors(validate.errors?.[0]);

    if (validate.isValid) {
      setFile(fileSelected);
    } else {
      setFile(null);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <Input
        ref={fileInputRef}
        style={{ display: 'none' }}
        type='file'
        onChange={handleFile}
        accept='.json, .xlsx'
        data-testid='file-input'
      />
      <div className={style.uploadArea} onClick={handleClick}>
        Click to upload Ontime project or xlsx file
      </div>
      {(file || errors) && (
        <UploadEntry file={file} errors={errors} progress={progress} success={success} handleClear={clearFile} />
      )}
    </>
  );
}
