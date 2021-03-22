import { Text } from '@chakra-ui/layout';
import {
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
} from '@chakra-ui/number-input';
import styles from './TimeInput.module.css';

export default function TimeInput(props) {
  return (
    <div className={styles.container}>
      <Text className={styles.label}>{props.label}</Text>
      <Text className={styles.label}>hour / min</Text>
      <div className={styles.timeInput}>
        <NumberInput min={0} max={24} maxW={20} allowMouseWheel>
          <NumberInputField />
          <NumberInputStepper>
            <NumberIncrementStepper />
            <NumberDecrementStepper />
          </NumberInputStepper>
        </NumberInput>
        <div className={styles.spacer} />
        <NumberInput min={0} max={59} maxW={20} allowMouseWheel>
          <NumberInputField />
          <NumberInputStepper>
            <NumberIncrementStepper />
            <NumberDecrementStepper />
          </NumberInputStepper>
        </NumberInput>
      </div>
    </div>
  );
}
