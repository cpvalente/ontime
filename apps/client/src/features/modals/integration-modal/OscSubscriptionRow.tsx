import { UseFormRegister } from 'react-hook-form';
import { Button, IconButton, Input, Switch } from '@chakra-ui/react';
import { FiChevronUp } from '@react-icons/all-files/fi/FiChevronUp';
import { IoRemove } from '@react-icons/all-files/io5/IoRemove';
import { OscSubscriptionOptions, TimerLifeCycle } from 'ontime-types';

import collapseStyles from '../../../common/components/collapse-bar/CollapseBar.module.scss';
import styles from '../Modal.module.scss';

interface OscSubscriptionRowProps {
  cycle: TimerLifeCycle;
  title: string;
  subtitle: string;
  visible: boolean;
  setShowSection: (cycle: TimerLifeCycle) => void;
  subscriptionOptions: OscSubscriptionOptions[];
  handleDelete: (cycle: TimerLifeCycle, id: string) => void;
  handleAddNew: (cycle: TimerLifeCycle) => void;
  register: UseFormRegister<any>;
}

export default function OscSubscriptionRow(props: OscSubscriptionRowProps) {
  const { cycle, title, subtitle, visible, setShowSection, subscriptionOptions, handleDelete, handleAddNew, register } =
    props;

  const hasTooManyOptions = subscriptionOptions.length >= 3;
  const headerStyle = `${styles.splitSection} ${visible ? '' : styles.showPointer}`;
  const registerPrefix = `subscriptions.${cycle}`;

  return (
    <>
      <div className={headerStyle} onClick={() => setShowSection(cycle)}>
        <div>
          <span className={`${styles.sectionTitle} ${styles.main}`}>{title}</span>
          {visible && <span className={styles.sectionSubtitle}>{subtitle}</span>}
        </div>
        <FiChevronUp className={visible ? collapseStyles.moreCollapsed : collapseStyles.moreExpanded} />
      </div>
      {visible && (
        <>
          {subscriptionOptions.map((option, idx) => (
            <div key={option.id} className={styles.entryRow}>
              <input type='hidden' {...register(`${registerPrefix}[${idx}].id`)} value={option.id} />
              <IconButton
                icon={<IoRemove />}
                onClick={() => handleDelete(cycle, option.id)}
                aria-label='delete'
                size='xs'
                colorScheme='red'
              />
              <Input
                placeholder='OSC Message'
                size='xs'
                variant='ontime-filled-on-light'
                {...register(`${registerPrefix}[${idx}].message`)}
              />
              <Switch variant='ontime-on-light' {...register(`${registerPrefix}[${idx}].enabled`)} />
            </div>
          ))}
          <Button
            onClick={() => handleAddNew(cycle)}
            className={styles.shiftRight}
            isDisabled={hasTooManyOptions}
            size='xs'
            colorScheme='blue'
            variant='outline'
            padding='0 2em'
          >
            Add new
          </Button>
        </>
      )}
    </>
  );
}
