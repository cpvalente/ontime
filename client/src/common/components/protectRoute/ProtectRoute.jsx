import React, { useCallback, useContext, useEffect, useState } from 'react';
import { IconButton } from '@chakra-ui/button';
import { HStack, PinInput, PinInputField } from '@chakra-ui/react';
import { FiCheck } from '@react-icons/all-files/fi/FiCheck';
import PropTypes from 'prop-types';

import { AppContext } from '../../../app/context/AppContext';

import style from './ProtectRoute.module.scss';

export default function ProtectRoute({ children }) {
  const isLocal =
    window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const [pin, setPin] = useState('');
  const [failed, setFailed] = useState(false);
  const { auth, validate } = useContext(AppContext);

  const handleValidation = useCallback(() => {
    const r = validate(pin);
    if (!r) {
      setFailed(true);
      setPin('');
    }
  }, [pin, validate]);

  // Set window title
  useEffect(() => {
    document.title = 'ontime';
  }, []);

  // Handle keyboard shortcuts
  const handleKeyPress = useCallback(
    (e) => {
      // handle held key
      if (e.repeat) return;
      // Space bar
      if (e.keyCode === 13) {
        handleValidation();
      }
    },
    [handleValidation]
  );

  useEffect(() => {
    // attach the event listener
    document.addEventListener('keydown', handleKeyPress);

    // remove the event listener
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyPress]);

  if (isLocal || auth) {
    return children;
  }

  return (
    <div className={style.container}>
      ontime
      <HStack spacing='10px' className={failed ? style.pin__failed : style.pin}>
        <PinInput
          type='alphanumeric'
          size='lg'
          mask
          autoFocus
          value={pin}
          onChange={(value) => {
            setFailed(false);
            setPin(value);
          }}
        >
          <PinInputField />
          <PinInputField />
          <PinInputField />
          <PinInputField />
        </PinInput>
        <IconButton
          aria-label='Enter'
          size='lg'
          isRound
          icon={<FiCheck />}
          onClick={() => handleValidation()}
        />
      </HStack>
    </div>
  );
}

ProtectRoute.propTypes = {
  children: PropTypes.node.isRequired,
};
