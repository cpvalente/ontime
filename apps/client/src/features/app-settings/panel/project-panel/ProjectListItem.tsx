import { useState } from 'react';
import { IconButton, Menu, MenuButton, MenuItem, MenuList } from '@chakra-ui/react';
import { IoEllipsisHorizontal } from '@react-icons/all-files/io5/IoEllipsisHorizontal';

import {
  deleteProject,
  downloadCSV,
  downloadProject,
  duplicateProject,
  loadProject,
  renameProject,
} from '../../../../common/api/db';
import { invalidateAllCaches, maybeAxiosError } from '../../../../common/api/utils';

import ProjectForm, { ProjectFormValues } from './ProjectForm';

import style from './ProjectPanel.module.scss';

export type EditMode = 'rename' | 'duplicate' | null;

interface ProjectListItemProps {
  current?: boolean;
  filename: string;
  createdAt: string;
  updatedAt: string;
  onToggleEditMode: (editMode: EditMode, filename: string | null) => void;
  onSubmit: () => void;
  onRefetch: () => Promise<void>;
  editingFilename: string | null;
  editingMode: EditMode | null;
}

export default function ProjectListItem({
  current,
  createdAt,
  editingFilename,
  editingMode,
  filename,
  onRefetch,
  onSubmit,
  onToggleEditMode,
  updatedAt,
}: ProjectListItemProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmitRename = async (values: ProjectFormValues) => {
    try {
      setSubmitError(null);

      if (!values.filename) {
        setSubmitError('Filename cannot be blank');
        return;
      }
      await renameProject(filename, values.filename);
      await onRefetch();
      onSubmit();
    } catch (error) {
      setSubmitError(maybeAxiosError(error));
    }
  };

  const handleSubmitDuplicate = async (values: ProjectFormValues) => {
    try {
      setSubmitError(null);

      if (!values.filename) {
        setSubmitError('Filename cannot be blank');
        return;
      }
      await duplicateProject(filename, values.filename);
      await onRefetch();
      onSubmit();
    } catch (error) {
      setSubmitError(maybeAxiosError(error));
    }
  };

  const handleToggleEditMode = (editMode: EditMode, filename: string | null) => {
    setSubmitError(null);
    onToggleEditMode(editMode, filename);
  };

  const handleCancel = () => {
    handleToggleEditMode(null, null);
  };

  const isCurrentlyBeingEdited = editingMode && filename === editingFilename;
  const classes = current && !isCurrentlyBeingEdited ? style.current : undefined;

  return (
    <tr key={filename} className={classes}>
      {isCurrentlyBeingEdited ? (
        <td colSpan={99}>
          <ProjectForm
            action={editingMode}
            filename={filename}
            onSubmit={editingMode === 'duplicate' ? handleSubmitDuplicate : handleSubmitRename}
            onCancel={handleCancel}
            submitError={submitError}
          />
        </td>
      ) : (
        <>
          <td className={style.containCell}>{filename}</td>
          <td>{new Date(createdAt).toLocaleString()}</td>
          <td>{new Date(updatedAt).toLocaleString()}</td>
          <td className={style.actionButton}>
            <ActionMenu
              current={current}
              filename={filename}
              onChangeEditMode={handleToggleEditMode}
              onRefetch={onRefetch}
            />
          </td>
        </>
      )}
    </tr>
  );
}

function ActionMenu({
  current,
  filename,
  onChangeEditMode,
  onRefetch,
}: {
  current?: boolean;
  filename: string;
  onChangeEditMode: (editMode: EditMode, filename: string) => void;
  onRefetch: () => Promise<void>;
}) {
  const handleLoad = async () => {
    await loadProject(filename);
    await invalidateAllCaches();
  };

  const handleRename = () => {
    onChangeEditMode('rename', filename);
  };

  const handleDuplicate = () => {
    onChangeEditMode('duplicate', filename);
  };

  const handleDelete = async () => {
    await deleteProject(filename);
    await onRefetch();
  };

  const handleDownload = async () => {
    await downloadProject(filename);
  };

  const handleExportCSV = async () => {
    await downloadCSV(filename);
  };

  return (
    <Menu variant='ontime-on-dark' size='sm'>
      <MenuButton
        as={IconButton}
        aria-label='Options'
        icon={<IoEllipsisHorizontal />}
        color='#e2e2e2' // $gray-200
        variant='ontime-ghosted'
        size='sm'
      />
      <MenuList>
        <MenuItem onClick={handleLoad} isDisabled={current}>
          Load
        </MenuItem>
        <MenuItem onClick={handleRename}>Rename</MenuItem>
        <MenuItem onClick={handleDuplicate}>Duplicate</MenuItem>
        <MenuItem onClick={handleDownload}>Download</MenuItem>
        {current && <MenuItem onClick={handleExportCSV}>Export CSV Rundown</MenuItem>}
        <MenuItem isDisabled={current} onClick={handleDelete}>
          Delete
        </MenuItem>
      </MenuList>
    </Menu>
  );
}
