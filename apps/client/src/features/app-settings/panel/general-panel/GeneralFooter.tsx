import { Box, Button, ModalFooter } from '@chakra-ui/react';

import styles from './Modal.module.scss';

interface GeneralFooterProps {
  formId: string;
  handleRevert: () => void;
  isDirty: boolean;
  isValid: boolean;
  isSubmitting: boolean;
}

export default function GeneralFooter(props: GeneralFooterProps) {
  const { formId, handleRevert, isDirty, isValid, isSubmitting } = props;

  const disableRevert = !isDirty;
  const disableSubmit = isSubmitting || !isDirty || !isValid;

  return (
    // <ModalFooter className={styles.buttonSection}>
    //   <Button isDisabled={disableRevert} variant='ontime-ghost-on-light' size='sm' onClick={handleRevert}>
    //     Revert to saved
    //   </Button>
    //   <Button
    //     type='submit'
    //     form={formId}
    //     isLoading={isSubmitting}
    //     isDisabled={disableSubmit}
    //     variant='ontime-filled'
    //     padding='0 2em'
    //     size='sm'
    //   >
    //     Save
    //   </Button>
    // </ModalFooter>
    <Box>
      <Button isDisabled={disableRevert} variant='ontime-ghost' size='sm' onClick={handleRevert}>
        Revert to saved
      </Button>
      <Button
        type='submit'
        form={formId}
        isLoading={isSubmitting}
        isDisabled={disableSubmit}
        variant='ontime-filled'
        padding='0 2em'
        size='sm'
      >
        Save
      </Button>
    </Box>
  );
}
