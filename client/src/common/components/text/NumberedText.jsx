import { Flex, Text } from '@chakra-ui/layout';
import styles from './NumberedText.module.css';

export default function NumberedText({ number = 1, text = '' }) {
  return (
    <Flex>
      <div className={styles.stylednumber}>{number}</div>
      <Text>{text}</Text>
    </Flex>
  );
}
