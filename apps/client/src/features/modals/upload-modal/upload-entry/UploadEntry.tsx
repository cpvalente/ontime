import { Progress } from '@chakra-ui/react';
import { IoClose } from '@react-icons/all-files/io5/IoClose';
import { IoDocumentTextOutline } from '@react-icons/all-files/io5/IoDocumentTextOutline';
import { IoWarningOutline } from '@react-icons/all-files/io5/IoWarningOutline';

import { isExcelFile, isOntimeFile } from '../uploadUtils';

import style from './UploadEntry.module.scss';

interface UploadEntryProps {
  file: File | null;
  errors?: string;
  progress: number;
  handleClear: () => void;
}

export default function UploadEntry(props: UploadEntryProps) {
  const { file, errors, progress, handleClear } = props;

  if (errors) {
    return (
      <div className={`${style.uploadedItem} ${style.error}`}>
        <IoClose className={style.cancelUpload} onClick={handleClear} />
        <IoWarningOutline className={style.icon} />
        <span className={style.fileTitle}>{errors}</span>
        <span className={style.fileInfo}>Please try again</span>
      </div>
    );
  }

  if (file) {
    const fileSize = `${(file.size / 1024).toFixed(2)}kb`;
    let fileType = '';
    if (isOntimeFile(file)) {
      fileType = 'Ontime Project File';
    } else if (isExcelFile(file)) {
      fileType = 'Excel Rundown';
    }

    return (
      <div className={style.uploadedItem}>
        <IoClose className={style.cancelUpload} onClick={handleClear} />
        <IoDocumentTextOutline className={style.icon} />
        <span className={style.fileTitle}>{file.name}</span>
        <span className={style.fileInfo}>{`${fileSize} - ${fileType}`}</span>
        <Progress variant='ontime-on-light' className={style.fileProgress} value={progress} />
      </div>
    );
  }

  return null;
}
