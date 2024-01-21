import { useCallback, useState } from 'react';
import { IconButton, Menu, MenuButton, MenuItem, MenuList } from '@chakra-ui/react';
import { IoEllipsisHorizontal } from '@react-icons/all-files/io5/IoEllipsisHorizontal';
import { AxiosError } from 'axios';

import { PROJECT_LIST } from '../../../../common/api/apiConstants';
import { invalidateAllCaches } from '../../../../common/api/apiUtils';
import { duplicateProject, loadProject, renameProject } from '../../../../common/api/ontimeApi';
import { ontimeQueryClient } from '../../../../common/queryClient';

import DuplicateRenameProjectForm, { DuplicateRenameProjectFormValues } from './DuplicateRenameProjectForm';
import { EditMode } from './ProjectList';

import style from './ProjectPanel.module.scss';

interface ProjectListItemProps {
  current?: boolean;
  filename: string;
  createdAt: string;
  updatedAt: string;
  onToggleEditMode: (editMode: EditMode, filename: string | null) => void;
  onSubmit: () => void;
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

  const handleSubmitRename = useCallback(
    async (values: DuplicateRenameProjectFormValues) => {
      try {
        setSubmitError(null);

        if (!values.filename) {
          setSubmitError('Filename cannot be blank');
          return;
        }
        await renameProject(filename, values.filename);
        await handleRefetch();
        onSubmit();
      } catch (error) {
        if (error instanceof AxiosError) {
          const errorMessage = error?.response?.data?.message;

          setSubmitError(errorMessage);
        } else {
          setSubmitError('An unknown error occurred');
        }
      }
    },
    [filename, onSubmit],
  );

  const handleSubmitDuplicate = useCallback(
    async (values: DuplicateRenameProjectFormValues) => {
      try {
        setSubmitError(null);

        if (!values.filename) {
          setSubmitError('Filename cannot be blank');
          return;
        }
        await duplicateProject(filename, values.filename);
        await handleRefetch();
        onSubmit();
      } catch (error) {
        if (error instanceof AxiosError) {
          const errorMessage = error?.response?.data?.message;

          setSubmitError(errorMessage);
        } else {
          setSubmitError('An unknown error occurred');
        }
      }
    },
    [filename, onSubmit],
  );

  const handleToggleEditMode = useCallback(
    (editMode: EditMode, filename: string | null) => {
      setSubmitError(null);
      onToggleEditMode(editMode, filename);
    },
    [onToggleEditMode],
  );

  const handleCancel = useCallback(() => {
    handleToggleEditMode(null, null);
  }, [handleToggleEditMode]);

  const isCurrentlyBeingEdited = editingMode && filename === editingFilename;

  return (
    <tr key={filename} className={current ? style.current : undefined}>
      <td colSpan={isCurrentlyBeingEdited ? 99 : 1}>
        {isCurrentlyBeingEdited ? (
          <DuplicateRenameProjectForm
            action={editingMode}
            filename={filename}
            onSubmit={editingMode === 'duplicate' ? handleSubmitDuplicate : handleSubmitRename}
            onCancel={handleCancel}
            submitError={submitError}
          />
        ) : (
          <span>{filename}</span>
        )}
      </td>
      {!isCurrentlyBeingEdited && (
        <>
          <td>{createdAt}</td>
          <td>{updatedAt}</td>
          <td className={style.actionButton}>
            <ActionMenu current={current} filename={filename} onChangeEditMode={handleToggleEditMode} />
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
}: {
  current?: boolean;
  filename: string;
  onChangeEditMode: (editMode: EditMode, filename: string) => void;
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
        <MenuItem>Delete</MenuItem>
      </MenuList>
    </Menu>
  );
}
