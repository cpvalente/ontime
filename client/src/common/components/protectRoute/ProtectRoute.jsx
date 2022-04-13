import React, { useCallback, useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import style from './ProtectRoute.module.scss';
import { PinInput, PinInputField } from '@chakra-ui/react';
import { IconButton } from '@chakra-ui/button';
import { FiCheck } from '@react-icons/all-files/fi/FiCheck';
import { AppContext } from '../../../app/context/AppContext';

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
  } else {
    return (
      <div className={style.container}>
        ontime
        <div className={failed ? style.pin__failed : style.pin}>
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
            style={{ fontSize: '1.5em' }}
            onClick={() => handleValidation()}
          />
        </div>
      </div>
    );
  }
}

ProtectRoute.propTypes = {
  children: PropTypes.node.isRequired,
};
