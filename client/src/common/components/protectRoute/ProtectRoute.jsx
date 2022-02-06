import React, { useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import style from './ProtectRoute.module.scss';
import { PinInput, PinInputField } from '@chakra-ui/react';
import { IconButton } from '@chakra-ui/button';
import { FiCheck } from '@react-icons/all-files/fi/FiCheck';
import { AppContext } from '../../../app/context/AppContext';


export default function ProtectRoute(props) {
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const [pin, setPin] = useState('');
  const [failed, setFailed] = useState(false);
  const { auth, validate } = useContext(AppContext);

  // Set window title
  useEffect(() => {
    document.title = 'ontime';
  }, []);

  const handleValidation = () => {
    const r = validate(pin);
    if (!r) {
      setFailed(true);
    }
  }

  return (
    <>
      {!isLocal && !auth ? (
        <div className={style.container}>
          ontime
          <div className={failed ? style.pin__failed : style.pin}>
            <PinInput
              type='alphanumeric'
              size='lg'
              mask
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
      ) : (
        props.children
      )}
    </>
  );
}

ProtectRoute.propTypes = {
  children: PropTypes.node.isRequired
};
