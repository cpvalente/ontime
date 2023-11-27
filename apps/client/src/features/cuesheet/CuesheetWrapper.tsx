import { useCallback, useEffect, useMemo, useState } from 'react';
import { OntimeRundownEntry, ProjectData } from 'ontime-types';

import Empty from '../../common/components/state/Empty';
import { useEventAction } from '../../common/hooks/useEventAction';
import { useCuesheet } from '../../common/hooks/useSocket';
import useRundown from '../../common/hooks-query/useRundown';
import useUserFields from '../../common/hooks-query/useUserFields';
import ExportModal, { ExportType } from '../modals/export-modal/ExportModal';

import CuesheetProgress from './cuesheet-progress/CuesheetProgress';
import CuesheetTableHeader from './cuesheet-table-header/CuesheetTableHeader';
import Cuesheet from './Cuesheet';
import { makeCuesheetColumns } from './cuesheetCols';
import { makeCSV, makeTable } from './cuesheetUtils';

import styles from './CuesheetWrapper.module.scss';

export default function CuesheetWrapper() {
  const { data: rundown } = useRundown();
  const { data: userFields } = useUserFields();
  const { updateEvent } = useEventAction();
  const featureData = useCuesheet();
  const columns = useMemo(() => makeCuesheetColumns(userFields), [userFields]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [headerData, setheaderData] = useState<ProjectData | null>(null);

  // Set window title
  useEffect(() => {
    document.title = 'ontime - Cuesheet';
  }, []);

  const handleUpdate = useCallback(
    async (rowIndex: number, accessor: keyof OntimeRundownEntry, payload: unknown) => {
      if (!rundown) {
        return;
      }

      if (rowIndex == null || accessor == null || payload == null) {
        return;
      }

      // check if value is the same
      const event = rundown[rowIndex];
      if (!event) {
        return;
      }

      if (event[accessor] === payload) {
        return;
      }
      // check if value is valid
      // as of now, the fields do not have any validation
      if (typeof payload !== 'string') {
        return;
      }

      // cleanup
      const cleanVal = payload.trim();
      const mutationObject = {
        id: event.id,
        [accessor]: cleanVal,
      };

      // submit
      try {
        await updateEvent(mutationObject);
      } catch (error) {
        console.error(error);
      }
    },
    [updateEvent, rundown],
  );

  const exportHandler = useCallback(
    (headerData: ProjectData, exportType: ExportType) => {
      if (!headerData || !rundown || !userFields) {
        return;
      }

      let fileName = '';
      let url = '';

      if (exportType === 'json') {
        const jsonContent = JSON.stringify({
          headerData,
          rundown,
          userFields,
        });

        fileName = 'ontime export.json';

        const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
        url = URL.createObjectURL(blob);
      } else if (exportType === 'csv') {
        const sheetData = makeTable(headerData, rundown, userFields);
        const csvContent = makeCSV(sheetData);

        fileName = 'ontime export.csv';

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        url = URL.createObjectURL(blob);
      } else {
        console.error('Invalid export type: ', exportType);
        return;
      }

      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      // Clean up the URL.createObjectURL to release resources
      URL.revokeObjectURL(url);
      return;
    },
    [rundown, userFields],
  );

  const onModalClose = (exportType?: ExportType) => {
    setIsModalOpen(false);

    if (!exportType) {
      return;
    }

    if (headerData) {
      exportHandler(headerData, exportType);
    }
  };

  const handleOpenModal = (projectData: ProjectData) => {
    setheaderData(projectData);
    setIsModalOpen(true);
  };

  if (!rundown || !userFields) {
    return <Empty text='Loading...' />;
  }

  return (
    <div className={styles.tableWrapper} data-testid='cuesheet'>
      <CuesheetTableHeader handleExport={handleOpenModal} featureData={featureData} />
      <CuesheetProgress />
      <Cuesheet data={rundown} columns={columns} handleUpdate={handleUpdate} selectedId={featureData.selectedEventId} />
      <ExportModal isOpen={isModalOpen} onClose={onModalClose} />
    </div>
  );
}
