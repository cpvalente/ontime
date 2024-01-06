import { IconButton, Menu, MenuButton, MenuItem, MenuList } from '@chakra-ui/react';
import { IoEllipsisHorizontal } from '@react-icons/all-files/io5/IoEllipsisHorizontal';

import { useProjectList } from '../../../../common/hooks-query/useProjectList';
import * as Panel from '../PanelUtils';

import style from './ProjectPanel.module.scss';

export default function ProjectList() {
  const { data } = useProjectList();
  const { files, lastLoadedProject } = data;

  // extract currently loaded from file list
  const currentlyLoadedIndex = files.findIndex((project) => project.filename === lastLoadedProject);
  const projectFiles = [...files];
  const current = projectFiles.splice(currentlyLoadedIndex, 1)[0];

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
              <ActionMenu />
            </td>
          </tr>
        )}
        {projectFiles.map((project) => {
          const createdAt = new Date(project.createdAt).toLocaleString();
          const updatedAt = new Date(project.updatedAt).toLocaleString();
          return (
            <tr key={project.filename}>
              <td>{project.filename}</td>
              <td>{createdAt}</td>
              <td>{updatedAt}</td>
              <td className={style.actionButton}>
                <ActionMenu />
              </td>
            </tr>
          );
        })}
      </tbody>
    </Panel.Table>
  );
}

function ActionMenu() {
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
        <MenuItem>Load</MenuItem>
        <MenuItem>Rename</MenuItem>
        <MenuItem>Duplicate</MenuItem>
        <MenuItem>Delete</MenuItem>
      </MenuList>
    </Menu>
  );
}
