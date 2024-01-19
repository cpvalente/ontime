import { Menu, MenuButton, IconButton, MenuList, MenuItem } from '@chakra-ui/react';
import { IoEllipsisHorizontal } from '@react-icons/all-files/io5/IoEllipsisHorizontal';
import { useEffect, useMemo, useState } from 'react';
import { AxiosError } from 'axios';

import style from './ProjectPanel.module.scss';
import { renameProject, loadProject, duplicateProject } from '../../../../common/api/ontimeApi';
import { ontimeQueryClient } from '../../../../common/queryClient';
import { PROJECT_LIST } from '../../../../common/api/apiConstants';
import { EditMode } from './ProjectList';
import RenameProjectForm, { RenameProjectFormValues } from './RenameProjectForm';
import DuplicateProjectForm, { DuplicateProjectFormValues } from './DuplicateProjectForm';

interface ProjectListItemProps {
  current?: boolean;
  filename: string;
  createdAt: string;
  updatedAt: string;
  onToggleEditMode?: (editMode: EditMode, filename: string | null) => void;
  onSubmit?: () => void;
  editingFilename: string | null;
  editingMode: EditMode | null;
}

export default function ProjectListItem({
  current,
  createdAt,
  editingFilename,
  editingMode,
  filename,
  onSubmit,
  onToggleEditMode,
  updatedAt,
}: ProjectListItemProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleRefetch = async () => {
    await ontimeQueryClient.invalidateQueries({ queryKey: PROJECT_LIST });
  };

  const handleSubmitRename = async (values: RenameProjectFormValues) => {
    try {
      if (!values.filename) {
        setSubmitError('Filename cannot be blank');
        return;
      }
      await renameProject(filename, values.filename);
      await handleRefetch();
      onSubmit?.();
    } catch (error) {
      if (error instanceof AxiosError) {
        const errorMessage = error?.response?.data?.message;

        setSubmitError(errorMessage);
      } else {
        setSubmitError('An unknown error occurred');
      }
    }
  };

  const handleSubmitDuplicate = async (values: DuplicateProjectFormValues) => {
    try {
      if (!values.newFilename) {
        setSubmitError('Filename cannot be blank');
        return;
      }
      await duplicateProject(filename, values.newFilename);
      await handleRefetch();
      onSubmit?.();
    } catch (error) {
      if (error instanceof AxiosError) {
        const errorMessage = error?.response?.data?.message;

        setSubmitError(errorMessage);
      } else {
        setSubmitError('An unknown error occurred');
      }
    }
  };

  const handleCancel = () => {
    onToggleEditMode?.(null, null);
  };

  useEffect(() => {
    setSubmitError(null);
  }, [editingMode]);

  const renderEditMode = useMemo(() => {
    switch (editingMode) {
      case 'rename':
        return (
          <RenameProjectForm
            filename={filename}
            onSubmit={handleSubmitRename}
            onCancel={handleCancel}
            submitError={submitError}
          />
        );
      case 'duplicate':
        return (
          <DuplicateProjectForm
            filename={filename}
            onSubmit={handleSubmitDuplicate}
            onCancel={handleCancel}
            submitError={submitError}
          />
        );
      default:
        return null;
    }
  }, [editingMode, filename, submitError]);

  const isCurrentlyBeingEdited = editingMode && filename === editingFilename;

  return (
    <tr key={filename} className={current ? style.current : undefined}>
      <td colSpan={isCurrentlyBeingEdited ? 4 : 1}>
        {isCurrentlyBeingEdited ? renderEditMode : <span>{filename}</span>}
      </td>
      {!isCurrentlyBeingEdited && (
        <>
          <td>{createdAt}</td>
          <td>{updatedAt}</td>
          <td className={style.actionButton}>
            <ActionMenu filename={filename} onAction={handleRefetch} onChangeEditMode={onToggleEditMode} />
          </td>
        </>
      )}
    </tr>
  );
}

function ActionMenu({
  filename,
  onAction,
  onChangeEditMode,
}: {
  filename: string;
  onAction?: () => void;
  onChangeEditMode?: (editMode: EditMode, filename: string) => void;
}) {
  const handleLoad = async () => {
    await loadProject(filename);
    onAction?.();
  };

  const handleRename = () => {
    onChangeEditMode?.('rename', filename);
  };

  const handleDuplicate = () => {
    onChangeEditMode?.('duplicate', filename);
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
        <MenuItem onClick={handleLoad}>Load</MenuItem>
        <MenuItem onClick={handleRename}>Rename</MenuItem>
        <MenuItem onClick={handleDuplicate}>Duplicate</MenuItem>
        <MenuItem>Delete</MenuItem>
      </MenuList>
    </Menu>
  );
}
