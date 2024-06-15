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
  updatedAt: string;
  onToggleEditMode: (editMode: EditMode, filename: string | null) => void;
  onSubmit: () => void;
  onRefetch: () => Promise<void>;
  editingFilename: string | null;
  editingMode: EditMode | null;
}

export default function ProjectListItem({
  current,
  updatedAt,
  editingFilename,
  editingMode,
  filename,
  onRefetch,
  onSubmit,
  onToggleEditMode,
}: ProjectListItemProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmitAction = (actionType: 'rename' | 'duplicate') => {
    return async (values: ProjectFormValues) => {
      setLoading(true);
      setSubmitError(null);
      try {
        if (!values.filename) {
          setSubmitError('Filename cannot be blank');
          return;
        }
        const action = actionType === 'rename' ? renameProject : duplicateProject;
        await action(filename, values.filename);
        await onRefetch();
        onSubmit();
      } catch (error) {
        setSubmitError(maybeAxiosError(error));
      }
      setLoading(false);
    };
  };

  const handleLoad = async (filename: string) => {
    setLoading(true);
    setSubmitError(null);
    try {
      await loadProject(filename);
      await onRefetch();
      await invalidateAllCaches();
    } catch (error) {
      setSubmitError(maybeAxiosError(error));
    }
    setLoading(false);
  };

  const handleDelete = async (filename: string) => {
    setLoading(true);
    setSubmitError(null);
    try {
      await deleteProject(filename);
      await onRefetch();
    } catch (error) {
      setSubmitError(maybeAxiosError(error));
    }
    setLoading(false);
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
            onSubmit={editingMode === 'duplicate' ? handleSubmitAction('duplicate') : handleSubmitAction('rename')}
            onCancel={handleCancel}
            submitError={submitError}
          />
        </td>
      ) : (
        <>
          <td className={style.containCell}>{filename}</td>
          <td>{new Date(updatedAt).toLocaleString()}</td>
          <td className={style.actionButton}>
            <ActionMenu
              current={current}
              filename={filename}
              onChangeEditMode={handleToggleEditMode}
              onDelete={handleDelete}
              onLoad={handleLoad}
              isDisabled={loading}
            />
          </td>
        </>
      )}
    </tr>
  );
}

interface ActionMenuProps {
  current?: boolean;
  filename: string;
  isDisabled: boolean;
  onChangeEditMode: (editMode: EditMode, filename: string) => void;
  onDelete: (filename: string) => void;
  onLoad: (filename: string) => void;
}
function ActionMenu(props: ActionMenuProps) {
  const { current, filename, isDisabled, onChangeEditMode, onDelete, onLoad } = props;

  const handleRename = () => {
    onChangeEditMode('rename', filename);
  };

  const handleDuplicate = () => {
    onChangeEditMode('duplicate', filename);
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
        isDisabled={isDisabled}
      />
      <MenuList>
        <MenuItem onClick={() => onLoad(filename)} isDisabled={current}>
          Load
        </MenuItem>
        <MenuItem onClick={handleRename}>Rename</MenuItem>
        <MenuItem onClick={handleDuplicate}>Duplicate</MenuItem>
        <MenuItem onClick={handleDownload}>Download</MenuItem>
        <MenuItem onClick={handleExportCSV}>Export CSV Rundown</MenuItem>
        <MenuItem isDisabled={current} onClick={() => onDelete(filename)}>
          Delete
        </MenuItem>
      </MenuList>
    </Menu>
  );
}
