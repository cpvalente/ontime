import { Button } from '@chakra-ui/button';
import { Editable, EditableInput, EditablePreview } from '@chakra-ui/editable';
import { Stack } from '@chakra-ui/layout';
import { Spacer } from '@chakra-ui/layout';
import { Text } from '@chakra-ui/layout';
import SingleTimeInput from '../../common/input/SingleTimeInput';
import TimeInput from '../../common/input/TimeInput';
import styles from './EventForm.module.css';

export default function EventForm(props) {
  return (
    <div>
      <Text className={styles.label}>Event Title </Text>
      <Editable defaultValue='Event Title'>
        <EditablePreview />
        <EditableInput />
      </Editable>

      <Text className={styles.label}>Event Subtitle </Text>
      <Editable defaultValue='Event Subtitle'>
        <EditablePreview />
        <EditableInput />
      </Editable>

      <Text className={styles.label}>Presenter Name </Text>
      <Editable defaultValue='Presenter Name'>
        <EditablePreview />
        <EditableInput />
      </Editable>

      <div className={styles.timings}>
        <TimeInput label='Scheduled Start' />
        <TimeInput label='Scheduled End' />
        <SingleTimeInput label='Timer' />
      </div>

      <div className={styles.buttons}>
        <Button variant='outline'>Cancel</Button>
        <Button colorScheme='teal'>Save</Button>
      </div>
    </div>
  );
}
