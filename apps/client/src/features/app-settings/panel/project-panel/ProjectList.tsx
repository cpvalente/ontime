import { IconButton, Input, Menu, MenuButton, MenuItem, MenuList } from '@chakra-ui/react';
import { IoEllipsisHorizontal } from '@react-icons/all-files/io5/IoEllipsisHorizontal';

import { useProjectList } from '../../../../common/hooks-query/useProjectList';
import * as Panel from '../PanelUtils';

import style from './ProjectPanel.module.scss';
import { loadProject } from '../../../../common/api/ontimeApi';
import { useState } from 'react';
import { IoSaveOutline } from '@react-icons/all-files/io5/IoSaveOutline';

export default function ProjectList() {
  const { data, refetch } = useProjectList();
  const { files, lastLoadedProject } = data;

  // extract currently loaded from file list
  const currentlyLoadedIndex = files.findIndex((project) => project.filename === lastLoadedProject);
  const projectFiles = [...files];
  const current = projectFiles.splice(currentlyLoadedIndex, 1)[0];

  // TODO: Improve this
  const [editing, setEditing] = useState<string | null>(null);

  const handleRefetch = () => {
    refetch();
  };

  const handleToggleRename = (filename: string) => {
    setEditing((prev) => (prev === filename ? null : filename));
  };

  return (
    <Panel.Table>
      <thead>
        <tr>
          <th>Project Name</th>
          <th>Date Created</th>
          <th>Date Modified</th>
          <th />
        </tr>
      </thead>
      <tbody>
        {current && (
          <tr className={style.current}>
            <td>{current.filename}</td>
            <td>{new Date(current.createdAt).toLocaleString()}</td>
            <td>{new Date(current.updatedAt).toLocaleString()}</td>
            <td className={style.actionButton}>
              <ActionMenu filename={current.filename} />
            </td>
          </tr>
        )}
        {projectFiles.map((project) => {
          const createdAt = new Date(project.createdAt).toLocaleString();
          const updatedAt = new Date(project.updatedAt).toLocaleString();
          return (
            <tr key={project.filename}>
              {project.filename === editing ? (
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
                    // ref={inputRef}
                    // data-testid='delay-input'
                    className={style.inputField}
                    type='text'
                    variant='ontime-filled'
                    // onFocus={handleFocus}
                    // onChange={(event) => setValue(event.target.value)}
                    // onBlur={(event) => validateAndSubmit(event.target.value)}
                    // onKeyDown={onKeyDownHandler}
                    value={project.filename}
                    maxLength={9}
                  />
                  <IconButton
                    size='sm'
                    icon={<IoSaveOutline />}
                    aria-label='Save duplicate project name'
                    variant={'ontime-filled'}
                  />
                </div>
              ) : (
                <td>{project.filename}</td>
              )}
              <td>{createdAt}</td>
              <td>{updatedAt}</td>
              <td className={style.actionButton}>
                <ActionMenu filename={project.filename} onAction={handleRefetch} onRename={handleToggleRename} />
              </td>
            </tr>
          );
        })}
      </tbody>
    </Panel.Table>
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
