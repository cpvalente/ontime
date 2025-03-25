import { useState } from 'react';
import { IoEllipsisHorizontal } from 'react-icons/io5';
import { IconButton, Menu, MenuButton, MenuItem, MenuList } from '@chakra-ui/react';

import {
  deleteProject,
  downloadCSV,
  downloadProject,
  duplicateProject,
  loadProject,
  renameProject,
} from '../../../../common/api/db';
import { invalidateAllCaches, maybeAxiosError } from '../../../../common/api/utils';
import { cx } from '../../../../common/utils/styleUtils';
import * as Panel from '../../panel-utils/PanelUtils';

import ProjectForm, { ProjectFormValues } from './ProjectForm';
import ProjectMergeForm from './ProjectMergeForm';

import style from './ProjectPanel.module.scss';

export type EditMode = 'rename' | 'duplicate' | 'merge' | null;

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
      } finally {
        setLoading(false);
      }
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
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (filename: string) => {
    setLoading(true);
    setSubmitError(null);
    try {
      await deleteProject(filename);
      await onRefetch();
    } catch (error) {
      setSubmitError(maybeAxiosError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEditMode = (editMode: EditMode, filename: string | null) => {
    setSubmitError(null);
    onToggleEditMode(editMode, filename);
  };

  const handleCancel = () => {
    handleToggleEditMode(null, null);
  };

  const isCurrentlyBeingEdited = filename === editingFilename;
  const showProjectForm = (editingMode === 'rename' || editingMode === 'duplicate') && filename === editingFilename;
  const showMergeForm = editingMode === 'merge' && isCurrentlyBeingEdited;
  const classes = cx([current && !isCurrentlyBeingEdited && style.current, isCurrentlyBeingEdited && style.isEditing]);

  return (
    <>
      {submitError && (
        <tr key='filename-error'>
          <td colSpan={99}>
            <Panel.Error>{submitError}</Panel.Error>
          </td>
        </tr>
      )}
      <tr key={filename} className={classes}>
        {showProjectForm ? (
          <td colSpan={99}>
            <ProjectForm
              action={editingMode}
              filename={filename}
              onSubmit={editingMode === 'duplicate' ? handleSubmitAction('duplicate') : handleSubmitAction('rename')}
              onCancel={handleCancel}
            />
          </td>
        ) : (
          <>
            <td className={style.containCell}>{filename}</td>
            <td>{current ? 'Currently loaded' : new Date(updatedAt).toLocaleString()}</td>
            <td>
              <ActionMenu
                current={current}
                filename={filename}
                onChangeEditMode={handleToggleEditMode}
                onDelete={handleDelete}
                onLoad={handleLoad}
                isDisabled={loading || showMergeForm}
                onMerge={(filename) => handleToggleEditMode('merge', filename)}
              />
            </td>
          </>
        )}
      </tr>
      {showMergeForm && (
        <tr>
          <td colSpan={99}>
            <ProjectMergeForm onClose={handleCancel} fileName={filename} />
          </td>
        </tr>
      )}
    </>
  );
}

interface ActionMenuProps {
  current?: boolean;
  filename: string;
  isDisabled: boolean;
  onChangeEditMode: (editMode: EditMode, filename: string) => void;
  onDelete: (filename: string) => Promise<void>;
  onLoad: (filename: string) => Promise<void>;
  onMerge: (filename: string) => void;
}
function ActionMenu(props: ActionMenuProps) {
  const { current, filename, isDisabled, onChangeEditMode, onDelete, onLoad, onMerge } = props;

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
        <MenuItem onClick={() => onMerge(filename)} isDisabled={current}>
          Partial Load
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
