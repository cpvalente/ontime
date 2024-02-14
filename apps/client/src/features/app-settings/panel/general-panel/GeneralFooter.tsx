import { Box, Button } from '@chakra-ui/react';
import style from './GeneralPanel.module.scss';

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
    <Box className={style.footer}>
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
