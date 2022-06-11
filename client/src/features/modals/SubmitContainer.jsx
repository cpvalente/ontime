import React from 'react';
import { Button } from '@chakra-ui/button';
import PropTypes from 'prop-types';

import style from './Modals.module.scss';

export default function SubmitContainer(props) {
  const { submitting, changed, revert, status } = props;

  return (
    <div className={style.submitContainer}>
      <Button
        isDisabled={submitting || !changed}
        variant='ghosted'
        onClick={revert}
      >
        Revert
      </Button>
      <Button
        colorScheme='blue'
        type='submit'
        isLoading={submitting}
        disabled={!changed || status !== 'success'}
      >
        Save
      </Button>
    </div>
  );
}

SubmitContainer.propTypes = {
  submitting: PropTypes.bool,
  changed: PropTypes.bool,
  status: PropTypes.string,
  revert: PropTypes.func.isRequired,
};
