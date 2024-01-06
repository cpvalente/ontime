import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { FormControl, Input, Switch } from '@chakra-ui/react';

import useOscSettings, { useOscSettingsMutation } from '../../../../common/hooks-query/useOscSettings';
import { PlaceholderSettings } from '../../../../common/models/OscSettings';
import { useEmitLog } from '../../../../common/stores/logger';
import { isIPAddress, isOnlyNumbers } from '../../../../common/utils/regex';
import ModalLoader from '../../modal-loader/ModalLoader';
import OntimeModalFooter from '../../OntimeModalFooter';

import styles from '../../Modal.module.scss';

export default function OscSettings() {
  const { data, isFetching } = useOscSettings();
  const { mutateAsync } = useOscSettingsMutation();
  const { emitError } = useEmitLog();
  const {
    handleSubmit,
    register,
    reset,
    setError,
    formState: { errors, isSubmitting, isDirty, isValid },
  } = useForm<PlaceholderSettings>({
    defaultValues: data,
    values: data,
    resetOptions: {
      keepDirtyValues: true,
    },
  });

  useEffect(() => {
    if (data) {
      reset(data);
    }
  }, [data, reset]);
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
      await mutateAsync(parsedValues);
    } catch (error) {
      emitError(`Error setting OSC: ${error}`);
    }
  };

  const resetForm = () => {
    reset(data);
  };

  if (isFetching) {
    return <ModalLoader />;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.sectionContainer} id='oscSettings'>
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
          variant='ontime-filled-on-light'
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
      <div style={{ height: '16px' }} />
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
          variant='ontime-filled-on-light'
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
          variant='ontime-filled-on-light'
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
      <OntimeModalFooter
        formId='oscSettings'
        handleRevert={resetForm}
        isDirty={isDirty}
        isValid={isValid}
        isSubmitting={isSubmitting}
      />
    </form>
  );
}
