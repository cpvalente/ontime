import { PropsWithChildren, useState } from 'react';
import { Button, ButtonGroup, IconButton, Input, Select } from '@chakra-ui/react';
import { IoAdd } from '@react-icons/all-files/io5/IoAdd';
import { IoChevronDown } from '@react-icons/all-files/io5/IoChevronDown';
import { IoTrash } from '@react-icons/all-files/io5/IoTrash';

import AutomationCard from './AutomationCard';
import { cycles } from './automationUtils';

import style from './AutomationItem.module.scss';

interface AutomationCardProps {
  title: string;
  trigger: string;
}

export default function AutomationItem(props: AutomationCardProps) {
  const { title, trigger } = props;
  const [expanded, setExpanded] = useState(false);

  return (
    <li className={style.cardItems}>
      <AutomationCard append='Automation title' className={style.cardCollapsed}>
        <Input className={style.fullWidth} size='sm' />
        <IconButton
          size='sm'
          variant='ontime-subtle'
          icon={<IoChevronDown />}
          aria-label='Edit entry'
          onClick={() => setExpanded((prev) => !prev)}
        />
        <IconButton
          size='sm'
          variant='ontime-subtle'
          icon={<IoTrash />}
          color='#FA5656'
          aria-label='Delete entry'
          onClick={() => setExpanded((prev) => !prev)}
        />
      </AutomationCard>
      {expanded && <AutomationCardExpanded title={title} trigger={trigger} />}
    </li>
  );
}

function AutomationCardExpanded(props: PropsWithChildren<AutomationCardProps>) {
  const { title, trigger } = props;
  const [triggerRole, setTriggerRole] = useState('all');

  return (
    <>
      <AutomationCard append='Trigger on'>
        <Select size='sm' variant='ontime'>
          {cycles.map((cycle) => (
            <option key={cycle.id} value={cycle.value}>
              {cycle.label}
            </option>
          ))}
        </Select>
      </AutomationCard>

      <AutomationCard
        append={
          <>
            If
            <ButtonGroup isAttached>
              <Button
                size='sm'
                variant={triggerRole === 'all' ? 'ontime-filled' : 'ontime-subtle'}
                onClick={() => setTriggerRole('all')}
              >
                All
              </Button>
              <Button
                size='sm'
                variant={triggerRole === 'any' ? 'ontime-filled' : 'ontime-subtle'}
                onClick={() => setTriggerRole('any')}
              >
                Any
              </Button>
            </ButtonGroup>
            match
          </>
        }
      >
        <div className={style.filterRow}>
          <Select size='sm' variant='ontime' placeholder='Select a field' value={undefined}>
            <option value=''>Title</option>
            <option value=''>Cue</option>
            <option value=''>Custom field</option>
          </Select>
          <Select size='sm' variant='ontime' placeholder='Select a matcher' value={undefined}>
            <option value=''>equals</option>
            <option value=''>not equals</option>
            <option value=''>contains</option>
            <option value=''>greater than</option>
            <option value=''>less than</option>
          </Select>
          <Input size='sm' variant='ontime-filled' />
          <IconButton
            size='sm'
            variant='ontime-subtle'
            icon={<IoTrash />}
            aria-label='Delete entry'
            onClick={() => undefined}
          />
        </div>
        <IconButton
          size='sm'
          variant='ontime-subtle'
          icon={<IoAdd />}
          aria-label='Add entry'
          onClick={() => undefined}
        />
      </AutomationCard>

      <AutomationCard append='Then send'>
        <Select />
        <div>
          <Input />
          <Input />
        </div>
        <IconButton
          size='sm'
          variant='ontime-subtle'
          icon={<IoAdd />}
          aria-label='Add entry'
          onClick={() => undefined}
        />
      </AutomationCard>
    </>
  );
}
