import { Button } from '@chakra-ui/react';

import * as Panel from '../PanelUtils';

import style from './ProjectPanel.module.scss';

type Project = {
  name: string;
  dateCreated: Date;
  dateModified: Date;
};

// TODO: Data from endpoint
const temp: Project[] = [
  {
    name: 'Project 1',
    dateCreated: new Date('2021-01-01'),
    dateModified: new Date('2021-01-01'),
  },
  {
    name: 'Project 2',
    dateCreated: new Date('2021-02-01'),
    dateModified: new Date('2021-02-02'),
  },
  {
    name: 'Project 3',
    dateCreated: new Date('2021-03-01'),
    dateModified: new Date('2021-03-03'),
  },
  {
    name: 'Project 4',
    dateCreated: new Date('2021-04-01'),
    dateModified: new Date('2021-04-04'),
  },
  {
    name: 'Project 5',
    dateCreated: new Date('2021-05-01'),
    dateModified: new Date('2021-05-05'),
  },
  {
    name: 'Project 6',
    dateCreated: new Date('2021-06-01'),
    dateModified: new Date('2021-06-06'),
  },
];

export default function ProjectList() {
  const data = temp;

  return (
    <Panel.Table>
      <thead>
        <tr>
          <th></th>
          <th>Project Name</th>
          <th>Date Created</th>
          <th>Date Modified</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td></td>
          <td>Loaded Project</td>
          <td>{new Date().toLocaleString()}</td>
          <td>{new Date().toLocaleString()}</td>
          <td className={style.buttonList}>
            <Button variant='ontime-subtle' size='xs'>
              LOAD
            </Button>
            <Button variant='ontime-subtle' size='xs'>
              RENAME
            </Button>
            <Button size='xs' colorScheme='red'>
              DELETE
            </Button>
          </td>
        </tr>
        {data.map((project) => {
          return (
            <tr key={project.name}>
              <td></td>
              <td>{project.name}</td>
              <td>{project.dateCreated.toLocaleString()}</td>
              <td>{project.dateModified.toLocaleString()}</td>
              <td className={style.buttonList}>
                <Button variant='ontime-subtle' size='xs'>
                  LOAD
                </Button>
                <Button variant='ontime-subtle' size='xs'>
                  RENAME
                </Button>
                <Button size='xs' colorScheme='red'>
                  DELETE
                </Button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </Panel.Table>
  );
}
