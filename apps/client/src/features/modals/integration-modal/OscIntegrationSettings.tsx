import { useContext } from 'react';
import { useForm } from 'react-hook-form';
import { Button, FormControl, Input, ModalBody, ModalFooter, Switch } from '@chakra-ui/react';

import { postOSC } from '../../../common/api/ontimeApi';
import { LoggingContext } from '../../../common/context/LoggingContext';
import useOscSettings from '../../../common/hooks-query/useOscSettings';
import { PlaceholderSettings } from '../../../common/models/OscSettings.type';
import { isIPAddress, isOnlyNumbers } from '../../../common/utils/regex';

import styles from '../Modal.module.scss';

export default function OscIntegrationSettings() {
  const { data } = useOscSettings();
  const { emitError } = useContext(LoggingContext);
  const {
    handleSubmit,
    register,
    reset,
    setError,
    formState: { errors, isSubmitting, isDirty, isValid },
  } = useForm<PlaceholderSettings>({
    defaultValues: data,
    values: data,
  });

  const disableSubmit = isSubmitting || !isDirty || !isValid;

  const onSubmit = async (values: PlaceholderSettings) => {
    const numericPortIn = Number(values.portIn);
    const numericPortOut = Number(values.portOut);

    if (numericPortIn === numericPortOut) {
      setError('portIn', { message: 'OSC IN and OUT Ports cant be the same' });
      return;
    }

    const parsedValues = {
      ...values,
      portIn: numericPortIn,
      portOut: numericPortOut,
    };

    try {
      await postOSC(parsedValues);
    } catch (error) {
      emitError(`Error setting OSC: ${error}`);
    }
  };

  const resetForm = () => reset(data);

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className={styles.sectionContainer} id='test'>
        <ModalBody>
          <div className={styles.splitSection}>
            <div>
              <span className={`${styles.sectionTitle} ${styles.main}`}>OSC Input</span>
              <span className={styles.sectionSubtitle}>Control Ontime with OSC</span>
            </div>
            <Switch {...register('enabledIn')} variant='ontime-on-light' />
          </div>

          <FormControl isInvalid={!!errors.portIn} className={styles.splitSection}>
            <label htmlFor='portIn'>
              <span className={styles.sectionTitle}>Listen on Port</span>
              {errors.portIn ? (
                <span className={styles.error}>{errors.portIn.message}</span>
              ) : (
                <span className={styles.sectionSubtitle}>Default 8888</span>
              )}
            </label>
            <Input
              id='portIn'
              placeholder='8888'
              width='75px'
              size='sm'
              textAlign='right'
              maxLength={5}
              {...register('portIn', {
                required: { value: true, message: 'Required field' },
                max: { value: 65535, message: 'Port in incorrect range (1024 - 65535)' },
                min: { value: 1024, message: 'Port in incorrect range (1024 - 65535)' },
                pattern: {
                  value: isOnlyNumbers,
                  message: 'Value should be numeric',
                },
              })}
            />
          </FormControl>

          <hr className={styles.divider} />

          <div className={styles.splitSection}>
            <div>
              <span className={styles.sectionTitle} style={{ fontWeight: 600 }}>
                OSC Output
              </span>
              <span className={styles.sectionSubtitle}>Ontime data feedback</span>
            </div>
            <Switch {...register('enabledOut')} variant='ontime-on-light' />
          </div>

          <FormControl isInvalid={!!errors.targetIP} className={styles.splitSection}>
            <label htmlFor='targetIP'>
              <span className={styles.sectionTitle}>OSC target IP</span>
              {errors.targetIP ? (
                <span className={styles.error}>{errors.targetIP.message}</span>
              ) : (
                <span className={styles.sectionSubtitle}>Default 127.0.0.1</span>
              )}
            </label>
            <Input
              id='targetIP'
              placeholder='127.0.0.1'
              width='140px'
              size='sm'
              textAlign='right'
              {...register('targetIP', {
                required: { value: true, message: 'Required field' },
                pattern: {
                  value: isIPAddress,
                  message: 'Invalid IP address',
                },
              })}
            />
          </FormControl>

          <FormControl className={styles.splitSection}>
            <label htmlFor='portOut'>
              <span className={styles.sectionTitle}>OSC target Port</span>
              {errors.portOut ? (
                <span className={styles.error}>{errors.portOut.message}</span>
              ) : (
                <span className={styles.sectionSubtitle}>Default 9999</span>
              )}
            </label>
            <Input
              id='portOut'
              placeholder='9999'
              width='75px'
              size='sm'
              textAlign='right'
              maxLength={5}
              {...register('portOut', {
                required: { value: true, message: 'Required field' },
                max: { value: 65535, message: 'Port in incorrect range (1024 - 65535)' },
                min: { value: 1024, message: 'Port in incorrect range (1024 - 65535)' },
                pattern: {
                  value: isOnlyNumbers,
                  message: 'Value should be numeric',
                },
              })}
            />
          </FormControl>
        </ModalBody>
        {/*<ModalSubmitFooter />*/}
      </form>
      <ModalFooter className={styles.buttonSection}>
        <Button variant='ontime-ghost-on-light' size='sm' onClick={resetForm}>
          Revert to saved
        </Button>
        <Button variant='ontime-subtle-on-light' size='sm'>
          Cancel
        </Button>
        <Button
          variant='ontime-filled'
          type='submit'
          form='test'
          disabled={disableSubmit}
          isLoading={isSubmitting}
          padding='0 2em'
          size='sm'
        >
          Save
        </Button>
      </ModalFooter>
    </>
  );
}
