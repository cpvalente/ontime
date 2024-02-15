import { useRef } from 'react';
import { Button, Select } from '@chakra-ui/react';
import { IoCloudDownloadOutline } from '@react-icons/all-files/io5/IoCloudDownloadOutline';
import { IoCloudUploadOutline } from '@react-icons/all-files/io5/IoCloudUploadOutline';

import * as Panel from '../PanelUtils';

import useGoogleSheet from './useGoogleSheet';

import style from './SourcesPanel.module.scss';

export default function GSheetImport() {
  const { stepData, worksheetOptions } = useGoogleSheet();
  const worksheetIdInputRef = useRef<HTMLSelectElement>(null);

  // imports the rundown from the selected worksheet
  const importRundown = () => {
    const worksheetId = worksheetIdInputRef.current?.value;
    if (!worksheetId) return;
    console.log('importing', worksheetId);
  };

  // exports the rundown to the selected worksheet
  const exportRundown = () => {
    const worksheetId = worksheetIdInputRef.current?.value;
    if (!worksheetId) return;

    console.log('exporting', worksheetId);
  };

  return (
    <Panel.ListGroup>
      <div className={style.buttonRow}>
        <div className={style.inputContainer}>
          <Select
            size='sm'
            variant='ontime'
            isDisabled={!stepData.worksheet.available}
            placeholder='Select worksheet'
            ref={worksheetIdInputRef}
          >
            {worksheetOptions.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </Select>
        </div>
        <Button
          variant='ontime-subtle'
          size='sm'
          onClick={exportRundown}
          isDisabled={!stepData.worksheet.available}
          leftIcon={<IoCloudUploadOutline />}
        >
          Export
        </Button>
        <Button
          variant='ontime-filled'
          size='sm'
          onClick={importRundown}
          isDisabled={!stepData.worksheet.available}
          leftIcon={<IoCloudDownloadOutline />}
        >
          Import preview
        </Button>
      </div>
      <Panel.Error>{stepData.worksheet.error}</Panel.Error>
      <Panel.Error>{stepData.pullPush.error}</Panel.Error>
    </Panel.ListGroup>
  );
}
