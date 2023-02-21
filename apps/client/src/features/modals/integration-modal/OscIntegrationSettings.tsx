import { useContext } from 'react';
import { useForm } from 'react-hook-form';
import { Button, FormControl, Input, ModalBody, ModalFooter, Switch } from '@chakra-ui/react';

import { postOSC } from '../../../common/api/ontimeApi';
import { LoggingContext } from '../../../common/context/LoggingContext';
import useOscSettings from '../../../common/hooks-query/useOscSettings';
import { OscSettingsType } from '../../../common/models/OscSettings.type';

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
  } = useForm<OscSettingsType>({
    defaultValues: data,
    values: data,
  });

  const disableSubmit = isSubmitting || !isDirty || !isValid;

  async function onSubmit(values: OscSettingsType) {
    if (Number(values.port) === Number(values.portOut)) {
      setError('port', { message: 'OSC IN and OUT Ports cant be the same' });
      return;
    }
    try {
      await postOSC(values);
    } catch (error) {
      emitError(`Error setting OSC: ${error}`);
    }
  }

  function resetForm() {
    reset(data);
  }

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className={styles.sectionContainer} id='test'>
        <ModalBody>
          <div className={styles.splitSection}>
            <div>
              <span className={`${styles.sectionTitle} ${styles.main}`}>OSC Input</span>
              <span className={styles.sectionSubtitle}>Control Ontime with OSC</span>
            </div>
            <div>
              <Switch {...register('enabled')} variant='ontime-on-light' />
            </div>
          </div>

          <FormControl isInvalid={!!errors.port} className={styles.splitSection}>
            <div>
              <label htmlFor='name' className={styles.sectionTitle}>
                Listen on Port
              </label>
              {errors.port ? (
                <span className={styles.error}>{errors.port.message}</span>
              ) : (
                <span className={styles.sectionSubtitle}>Default 8888</span>
              )}
            </div>
            <div>
              <Input
                placeholder='8888'
                width='75px'
                size='sm'
                textAlign='right'
                maxLength={5}
                {...register('port', {
                  required: { value: true, message: 'Required field' },
                  max: { value: 65535, message: 'Port in incorrect range (1024 - 65535)' },
                  min: { value: 1024, message: 'Port in incorrect range (1024 - 65535)' },
                })}
              />
            </div>
          </FormControl>

          <hr className={styles.divider} />

          <div className={styles.splitSection}>
            <div>
              <span className={styles.sectionTitle} style={{ fontWeight: 600 }}>
                OSC Output
              </span>
              <span className={styles.sectionSubtitle}>Ontime data feedback</span>
            </div>
            <div>
              <Switch variant='ontime-on-light' isChecked={true} />
              {/*<Switch {...register('enabledOutput')} variant='ontime-on-light' isChecked={true} />*/}
            </div>
          </div>

          <FormControl isInvalid={!!errors.targetIP} className={styles.splitSection}>
            <div>
              <label htmlFor='targetIP' className={styles.sectionTitle}>
                OSC target IP
              </label>
              {errors.targetIP ? (
                <span className={styles.error}>{errors.targetIP.message}</span>
              ) : (
                <span className={styles.sectionSubtitle}>Default 127.0.0.1</span>
              )}
            </div>
            <div>
              <Input
                placeholder='127.0.0.1'
                width='140px'
                size='sm'
                textAlign='right'
                {...register('targetIP', {
                  required: { value: true, message: 'Required field' },
                })}
              />
            </div>
          </FormControl>

          <FormControl className={styles.splitSection}>
            <div>
              <label htmlFor='name' className={styles.sectionTitle}>
                OSC target Port
              </label>
              {errors.portOut ? (
                <span className={styles.error}>{errors.portOut.message}</span>
              ) : (
                <span className={styles.sectionSubtitle}>Default 9999</span>
              )}
            </div>
            <div>
              <Input
                placeholder='9999'
                width='75px'
                size='sm'
                textAlign='right'
                maxLength={5}
                {...register('portOut', {
                  required: { value: true, message: 'Required field' },
                  max: { value: 65535, message: 'Port in incorrect range (1024 - 65535)' },
                  min: { value: 1024, message: 'Port in incorrect range (1024 - 65535)' },
                })}
              />
            </div>
          </FormControl>
        </ModalBody>
        {/*<ModalSubmitFooter />*/}
      </form>
      <ModalFooter className={styles.buttonSection}>
        <Button variant='ghosted' paddingLeft={0} color='#6c6c6c' size='sm' onClick={resetForm}>
          Revert to saved
        </Button>
        <Button colorScheme='gray' size='sm'>
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
