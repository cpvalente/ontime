import { Menu, MenuButton, IconButton, MenuList, MenuItem, Input } from '@chakra-ui/react';
import { IoEllipsisHorizontal } from '@react-icons/all-files/io5/IoEllipsisHorizontal';
import { useState, useRef } from 'react';
import { IoSaveOutline } from '@react-icons/all-files/io5/IoSaveOutline';

import style from './ProjectPanel.module.scss';
import { renameProject, loadProject } from '../../../../common/api/ontimeApi';
import { ontimeQueryClient } from '../../../../common/queryClient';
import { PROJECT_LIST } from '../../../../common/api/apiConstants';

type EditMode = 'rename' | 'duplicate';

interface ProjectListItemProps {
  filename: string;
  createdAt: string;
  updatedAt: string;
}

export default function ProjectListItem({ filename, createdAt, updatedAt }: ProjectListItemProps) {
  const [editingMode, setEditingMode] = useState<EditMode | null>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  const handleRefetch = async () => {
    await ontimeQueryClient.invalidateQueries({ queryKey: PROJECT_LIST });
  };

  const handleToggleEditMode = (editMode: EditMode) => {
    setEditingMode((prev) => (prev === editMode ? null : editMode));
  };

  const handleSubmitRename = async () => {
    await renameProject(filename, renameInputRef.current!.value);
    await handleRefetch();
    setEditingMode(null);
  };

  return (
    <tr key={filename}>
      {editingMode === 'rename' ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '100%',
          }}
        >
          <Input
            size='md'
            ref={renameInputRef}
            className={style.inputField}
            type='text'
            variant='ontime-filled'
            defaultValue={filename}
          />
          <IconButton
            size='sm'
            icon={<IoSaveOutline />}
            aria-label='Save duplicate project name'
            variant={'ontime-filled'}
            onClick={handleSubmitRename}
          />
        </div>
      ) : (
        <>
          <td>
            <span>{filename}</span>
            {editingMode === 'duplicate' ? (
              <>
                <Input
                  size='md'
                  ref={renameInputRef}
                  className={style.inputField}
                  type='text'
                  variant='ontime-filled'
                  defaultValue={filename}
                />
                <IconButton
                  size='sm'
                  icon={<IoSaveOutline />}
                  aria-label='Save duplicate project name'
                  variant={'ontime-filled'}
                  onClick={handleSubmitRename}
                />
              </>
            ) : null}
          </td>
        </>
      )}
      <td>{createdAt}</td>
      <td>{updatedAt}</td>
      <td className={style.actionButton}>
        <ActionMenu filename={filename} onAction={handleRefetch} onChangeEditMode={handleToggleEditMode} />
      </td>
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
  onChangeEditMode?: (editMode: EditMode) => void;
}) {
  const handleLoad = async () => {
    await loadProject(filename);
    onAction?.();
  };

  const handleRename = () => {
    onChangeEditMode?.('rename');
  };

  const handleDuplicate = () => {
    onChangeEditMode?.('duplicate');
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
