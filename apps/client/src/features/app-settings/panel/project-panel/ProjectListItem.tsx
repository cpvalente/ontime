import { Menu, MenuButton, IconButton, MenuList, MenuItem, Input } from '@chakra-ui/react';
import { IoEllipsisHorizontal } from '@react-icons/all-files/io5/IoEllipsisHorizontal';
import { useState, useRef } from 'react';
import { IoSaveOutline } from '@react-icons/all-files/io5/IoSaveOutline';

import style from './ProjectPanel.module.scss';
import { renameProject, loadProject } from '../../../../common/api/ontimeApi';
import { ontimeQueryClient } from '../../../../common/queryClient';
import { PROJECT_LIST } from '../../../../common/api/apiConstants';

type EditMode = "rename" | "duplicate";

interface ProjectListItemProps {
    filename: string;
    createdAt: string;
    updatedAt: string;
}

export default function ProjectListItem({ filename, createdAt, updatedAt }: ProjectListItemProps) {
    const [editing, setEditing] = useState<EditMode | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleRefetch = async () => {
        await ontimeQueryClient.invalidateQueries({ queryKey: PROJECT_LIST });
    };

    const handleToggleRename = () => {
        setEditing(editing === "rename" ? null : "rename");
    };

    const handleSubmitRename = async () => {
        await renameProject(filename, inputRef.current!.value);
        await handleRefetch();
        setEditing(null);
    };

    return (
        <tr key={filename}>
              {editing === "rename" ? (
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
                    ref={inputRef}
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
                <td>{filename}</td>
              )}
            <td>{createdAt}</td>
            <td>{updatedAt}</td>
            <td className={style.actionButton}>
                <ActionMenu filename={filename} onAction={handleRefetch} onRename={handleToggleRename} />
            </td>
        </tr>
    );
}
function ActionMenu({
    filename,
    onAction,
    onRename,
}: {
    filename: string;
    onAction?: () => void;
    onRename?: () => void;
}) {
    const handleLoad = async () => {
        await loadProject(filename);
        onAction?.();
    };

    const handleRename = () => {
        onRename?.();
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
                <MenuItem>Duplicate</MenuItem>
                <MenuItem>Delete</MenuItem>
            </MenuList>
        </Menu>
    );
}
