import { Button, ModalFooter } from '@chakra-ui/react';

import styles from './Modal.module.scss';

export default function ModalSubmitFooter() {
  return (
    <ModalFooter className={styles.buttonSection}>
      <Button variant='ghosted' paddingLeft={0} color='#6c6c6c'>
        Revert to saved
      </Button>
      <Button colorScheme='gray'>Cancel</Button>
      <Button
        variant='ontime-filled'
        type='submit'
        // disabled={isSubmitting}
        isLoading={false}
        padding='0 2.5em'
      >
        Save
      </Button>
    </ModalFooter>
  );
}
