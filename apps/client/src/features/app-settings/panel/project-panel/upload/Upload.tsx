import { useEffect, useRef, useState } from 'react';
import { clear } from 'console';
import { OntimeRundown, ProjectData, UserFields } from 'ontime-types';
import { defaultExcelImportMap, ExcelImportMap } from 'ontime-utils';

import { PROJECT_DATA, RUNDOWN, USERFIELDS } from '../../../../../common/api/apiConstants';
import { invalidateAllCaches, maybeAxiosError } from '../../../../../common/api/apiUtils';
import {
  patchData,
  postPreviewExcel,
  ProjectFileImportOptions,
  uploadProjectFile,
} from '../../../../../common/api/ontimeApi';
import { projectDataPlaceholder } from '../../../../../common/models/ProjectData';
import { userFieldsPlaceholder } from '../../../../../common/models/UserFields';
import { ontimeQueryClient } from '../../../../../common/queryClient';
import PreviewExcel from '../../../../modals/upload-modal/preview/PreviewExcel';
import ExcelFileOptions from '../../../../modals/upload-modal/upload-options/ExcelFileOptions';
import OntimeFileOptions from '../../../../modals/upload-modal/upload-options/OntimeFileOptions';
import UploadFile from '../../../../modals/upload-modal/UploadFile';

import UploadArea from './UploadArea';
import { getPersistedOptions, isExcelFile, isOntimeFile, persistOptions } from './utils';

const noop = () => undefined;

export default function Upload() {
  const queryClient = ontimeQueryClient;
  const [file, setFile] = useState<File | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [rundown, setRundown] = useState<OntimeRundown | null>(null);
  const [userFields, setUserFields] = useState<UserFields | null>(null);
  const [project, setProject] = useState<ProjectData | null>(null);

  const [errors, setErrors] = useState('');

  const ontimeFileOptions = useRef<Partial<ProjectFileImportOptions>>({});
  const excelFileOptions = useRef<ExcelImportMap>(defaultExcelImportMap);

  const updateOntimeFileOptions = <T extends keyof ProjectFileImportOptions>(
    field: T,
    value: ProjectFileImportOptions[T],
  ) => {
    ontimeFileOptions.current = { ...ontimeFileOptions.current, [field]: value };
  };

  const updateExcelFileOptions = <T extends keyof ExcelImportMap>(field: T, value: ExcelImportMap[T]) => {
    if (excelFileOptions.current[field] !== value) {
      excelFileOptions.current = { ...excelFileOptions.current, [field]: value };
    }
  };

  // We want to populate the options with any previous options given by the user
  useEffect(() => {
    const excelOptions = getPersistedOptions('excel');
    if (excelOptions) {
      excelFileOptions.current = excelOptions;
    }
  }, []);

  // if the modal re-opens, we want to restart all states
  useEffect(() => {
    clear();
    setSubmitting(false);
    setRundown(null);
    setUserFields(null);
    setProject(null);
    setErrors('');
  }, []);

  /* uploads file to backend
   * - in the case of excel, we get the preview
   * - in the case of project file, this is end of line
   **/
  const handleUpload = async () => {
    let doClose = false;
    if (file) {
      setSubmitting(true);
      setErrors('');
      try {
        if (isOntimeFile(file)) {
          // TODO: we would also like to have preview for ontime project files
          const options = ontimeFileOptions.current;
          await handleOntimeFile(file, options);
          await invalidateAllCaches();
          doClose = true;
        } else if (isExcelFile(file)) {
          const options = excelFileOptions.current;
          persistOptions({ optionType: 'excel', options });
          await handleExcelFile(file, options);
        }
      } catch (error) {
        const message = maybeAxiosError(error);
        setErrors(`Failed uploading file ${message}`);
      } finally {
        setSubmitting(false);
        if (doClose) {
          handleClose();
        }
      }
    }

    // when we upload excel, we populate state with preview data
    async function handleExcelFile(file: File, options: ExcelImportMap) {
      const response = await postPreviewExcel(file, () => undefined, options);
      if (response.status === 200) {
        setRundown(response.data.rundown);
        setUserFields(response.data.userFields);
        setProject(response.data.project);
      }
    }

    // when we upload project files, no extra operations are done
    async function handleOntimeFile(file: File, options: Partial<ProjectFileImportOptions>) {
      await uploadProjectFile(file, () => undefined, options);
    }
  };

  // before closing the modal, we clear data from mutations
  const handleClose = () => {
    clear();
    setRundown([]);
    setUserFields(userFieldsPlaceholder);
    setProject(projectDataPlaceholder);
    onClose();
  };

  const handleFinalise = async () => {
    // this step is currently only used for excel files, after preview
    if (isExcel && rundown && userFields && project) {
      let doClose = false;
      setSubmitting(true);
      try {
        await patchData({ rundown, userFields, project });
        queryClient.setQueryData(RUNDOWN, { rundown, revision: -1 });
        queryClient.setQueryData(USERFIELDS, userFields);
        queryClient.setQueryData(PROJECT_DATA, project);
        await queryClient.invalidateQueries({
          queryKey: [...RUNDOWN, ...USERFIELDS, ...PROJECT_DATA],
        });
        doClose = true;
      } catch (error) {
        const message = maybeAxiosError(error);
        setErrors(`Failed applying changes ${message}`);
      } finally {
        setSubmitting(false);
        if (doClose) {
          handleClose();
        }
      }
    }
  };

  const undoReview = () => {
    setErrors('');
  };

  const isExcel = isExcelFile(file);
  const isOntime = isOntimeFile(file);

  return (
    <>
      <div></div>
      {file === null && <UploadArea setFile={setFile} />}
    </>
  );
}
