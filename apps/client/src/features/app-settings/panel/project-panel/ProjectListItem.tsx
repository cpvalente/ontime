import { useState } from 'react';
import { IconButton, Menu, MenuButton, MenuItem, MenuList } from '@chakra-ui/react';
import { IoEllipsisHorizontal } from '@react-icons/all-files/io5/IoEllipsisHorizontal';

import { invalidateAllCaches, maybeAxiosError } from '../../../../common/api/apiUtils';
import { deleteProject, duplicateProject, loadProject, renameProject } from '../../../../common/api/ontimeApi';

import ProjectForm, { ProjectFormValues } from './ProjectForm';
import { EditMode } from './ProjectList';

import style from './ProjectPanel.module.scss';

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

  return (
    <tr key={filename} className={current ? style.current : undefined}>
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
          <td>{filename}</td>
          <td>{createdAt}</td>
          <td>{updatedAt}</td>
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

  return (
    <Menu variant='ontime-on-dark' size='sm'>
      <MenuButton
        as={IconButton}
        aria-label='Options'
        icon={<IoEllipsisHorizontal />}
        variant='ontime-ghosted'
        size='sm'
      />
      <MenuList>
        <MenuItem onClick={handleLoad} isDisabled={current}>
          Load
        </MenuItem>
        <MenuItem onClick={handleRename}>Rename</MenuItem>
        <MenuItem onClick={handleDuplicate}>Duplicate</MenuItem>
        <MenuItem isDisabled={current} onClick={handleDelete}>
          Delete
        </MenuItem>
      </MenuList>
    </Menu>
  );
}
