import { Menu, MenuButton, IconButton, MenuList, MenuItem, Input } from '@chakra-ui/react';
import { IoEllipsisHorizontal } from '@react-icons/all-files/io5/IoEllipsisHorizontal';
import { useState, useRef } from 'react';
import { IoSaveOutline } from '@react-icons/all-files/io5/IoSaveOutline';

import style from './ProjectPanel.module.scss';
import { renameProject, loadProject } from '../../../../common/api/ontimeApi';

interface ProjectListItemProps {
    filename: string;
    createdAt: string;
    updatedAt: string;
    onRefetch?: () => void;
}

export default function ProjectListItem({ filename, createdAt, updatedAt, onRefetch }: ProjectListItemProps) {
    // TODO: Improve this
    const [editing, setEditing] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleRefetch = () => {
        onRefetch?.();
    };

    const handleToggleRename = (filename: string) => {
        setEditing((prev) => (prev === filename ? null : filename));
    };

    const handleSubmitRename = () => {
        renameProject(editing!, inputRef.current!.value);
        handleRefetch();
    };

    return (
        <tr key={filename}>
              {filename === editing ? (
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
                    size='sm'
                    ref={inputRef}
                    // data-testid='delay-input'
                    className={style.inputField}
                    type='text'
                    variant='ontime-filled'
                    // onFocus={handleFocus}
                    // onChange={(event) => setValue(event.target.value)}
                    // onBlur={(event) => validateAndSubmit(event.target.value)}
                    // onKeyDown={onKeyDownHandler}
                    // value={project.filename}
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
    onRename?: (filename: string) => void;
}) {
    const handleLoad = async () => {
        await loadProject(filename);
        onAction?.();
        // TODO: Add a toast or something here
    };

    const handleRename = () => {
        onRename?.(filename);
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
