import { Menu, MenuButton, IconButton, MenuList, MenuItem, Input, FormControl } from '@chakra-ui/react';
import { IoEllipsisHorizontal } from '@react-icons/all-files/io5/IoEllipsisHorizontal';
import { useRef, useMemo } from 'react';
import { IoSaveOutline } from '@react-icons/all-files/io5/IoSaveOutline';

import style from './ProjectPanel.module.scss';
import { renameProject, loadProject, duplicateProject } from '../../../../common/api/ontimeApi';
import { ontimeQueryClient } from '../../../../common/queryClient';
import { PROJECT_LIST } from '../../../../common/api/apiConstants';
import { IoClose } from '@react-icons/all-files/io5/IoClose';
import { EditMode } from './ProjectList';

interface ProjectListItemProps {
  filename: string;
  createdAt: string;
  updatedAt: string;
  onToggleEditMode?: (editMode: EditMode, filename: string) => void;
  onSubmit?: () => void;
  editingFilename: string | null;
  editingMode: EditMode | null;
}

export default function ProjectListItem({
  filename,
  createdAt,
  updatedAt,
  onToggleEditMode,
  onSubmit,
  editingFilename,
  editingMode,
}: ProjectListItemProps) {
  const renameInputRef = useRef<HTMLInputElement>(null);
  const duplicateInputRef = useRef<HTMLInputElement>(null);

  const handleRefetch = async () => {
    await ontimeQueryClient.invalidateQueries({ queryKey: PROJECT_LIST });
  };

  const handleSubmitRename = async () => {
    await renameProject(filename, renameInputRef.current!.value);
    await handleRefetch();
    onSubmit?.();
  };

  const handleSubmitDuplicate = async () => {
    await duplicateProject(filename, duplicateInputRef.current!.value);
    await handleRefetch();
    onSubmit?.();
  };

  const renderEditMode = useMemo(() => {
    switch (editingMode) {
      case 'rename':
        return (
          <>
            <Input
              className={style.inputField}
              defaultValue={filename}
              ref={renameInputRef}
              size='md'
              type='text'
              variant='ontime-filled'
            />
            <IconButton
              aria-label='Save duplicate project name'
              icon={<IoSaveOutline />}
              onClick={handleSubmitRename}
              size='sm'
              variant='ontime-filled'
            />
          </>
        );
      case 'duplicate':
        return (
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexDirection: 'column',
              }}
            >
              <FormControl>
                <label htmlFor='filename'>
                  <span>Current name</span>
                </label>
                <Input
                  className={style.inputField}
                  defaultValue={filename}
                  id='filename'
                  size='md'
                  type='text'
                  variant='ontime-filled'
                  disabled
                />
              </FormControl>
              <FormControl>
                <label htmlFor='newFilename'>
                  <span>New name</span>
                </label>
                <Input
                  className={style.inputField}
                  defaultValue={filename}
                  id='newFilename'
                  ref={duplicateInputRef}
                  size='md'
                  type='text'
                  variant='ontime-filled'
                />
              </FormControl>
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-around',
              }}
            >
              <IconButton
                aria-label='Save duplicate project name'
                icon={<IoSaveOutline />}
                onClick={handleSubmitDuplicate}
                size='sm'
                variant='ontime-filled'
              />
              <IconButton
                aria-label='Save duplicate project name'
                icon={<IoClose />}
                onClick={handleSubmitDuplicate}
                size='sm'
                variant='ontime-filled'
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  }, [editingMode, filename]);

  return (
    <tr key={filename}>
      {editingMode && filename === editingFilename ? (
        renderEditMode
      ) : (
        <>
          <td>
            <span>{filename}</span>
          </td>
        </>
      )}
      <td>{createdAt}</td>
      <td>{updatedAt}</td>
      <td className={style.actionButton}>
        <ActionMenu filename={filename} onAction={handleRefetch} onChangeEditMode={onToggleEditMode} />
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
