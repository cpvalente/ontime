import { useCallback, useEffect, useState } from 'react';
import {
  FormControl,
  InputGroup,
  InputRightAddon,
  ModalBody,
  NumberInput,
  NumberInputField,
  Switch,
} from '@chakra-ui/react';

import { useEmitLog } from '@/common/stores/logger';

import { postView } from '../../common/api/ontimeApi';
import PopoverPicker from '../../common/components/input/popover-picker/PopoverPicker';
import useViewSettings from '../../common/hooks-query/useViewSettings';
import { viewsSettingsPlaceholder } from '../../common/models/ViewSettings.type';
import { forgivingStringToMillis, millisToMinutes } from '../../common/utils/dateConfig';

import { numberInputProps } from './modalHelper';
import SubmitContainer from './SubmitContainer';

import styles from './Modal.module.scss';
import style from './Modals.module.scss';

export default function ViewsSettingsModal() {
  const { data, status, refetch } = useViewSettings();

  const { emitError } = useEmitLog();
  const [formData, setFormData] = useState(viewsSettingsPlaceholder);
  const [changed, setChanged] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  /**
   * Set formdata from server state
   */
  useEffect(() => {
    if (data == null) return;
    if (changed) return;
    setFormData({ ...data });
  }, [changed, data]);

  /**
   * Validate and submit data
   */
  const submitHandler = useCallback(
    async (event) => {
      event.preventDefault();
      setSubmitting(true);
      try {
        await postView(formData);
      } catch (error) {
        emitError(`Error view settings: ${error}`);
      } finally {
        await refetch();
        setChanged(false);
      }
      setSubmitting(false);
    },
    [emitError, formData, refetch],
  );

  /**
   * Reverts local state equals to server state
   */
  const revert = useCallback(async () => {
    setChanged(false);
    await refetch();
  }, [refetch]);

  /**
   * Handles change of input field in local state
   * @param {string} field - object parameter to update
   * @param {(string | number | boolean)} value - new object parameter value
   */
  const handleChange = useCallback(
    (field, value) => {
      const temp = { ...formData };
      temp[field] = value;
      setFormData(temp);
      setChanged(true);
    },
    [formData],
  );

  function handleThresholdChange(field, value) {
    const temp = { ...formData };
    value = forgivingStringToMillis(value);
    temp[field] = value;
    setFormData(temp);
    setChanged(true);
  }

  const stylingDocsUrl = 'https://cpvalente.gitbook.io/ontime/features/custom-styling';

  return (
    <form onSubmit={submitHandler} className={styles.sectionContainer} id='viewSettings'>
      <ModalBody className={style.modalBody}>
        <p className={style.notes}>
          Options related to the viewers
          <br />
          <a href={stylingDocsUrl} target='_blank' rel='noreferrer'>
            Read the docs
          </a>
        </p>
        <div className={style.hSeparator}>Style Options</div>
        <div className={styles.splitSection}>
          <div>
            <span className={`${styles.sectionTitle} ${styles.main}`}>Override CSS Styles</span>
            <span className={styles.sectionSubtitle}>Enable / Disable override</span>
          </div>
          <Switch onChange={() => handleChange('overrideStyles', !formData.overrideStyles)} variant='ontime-on-light' />
        </div>
        <hr className={styles.divider} />
        <div className={style.hSeparator}>Timer Options</div>
        <div className={styles.splitSection}>
          <div>
            <span className={`${styles.sectionTitle} ${styles.main}`}>Normal Color</span>
            <span className={styles.sectionSubtitle}>Change timer Normal Color</span>
          </div>
          <PopoverPicker
            name='normalColor'
            color={formData.normalColor}
            onChange={(event) => handleChange('normalColor', event)}
          />
        </div>
        <div className={styles.splitSection}>
          <div>
            <span className={`${styles.sectionTitle} ${styles.main}`}>Warning Color</span>
            <span className={styles.sectionSubtitle}>Change timer Warning Color</span>
          </div>
          <PopoverPicker
            name='warningColor'
            color={formData.warningColor}
            onChange={(event) => handleChange('warningColor', event)}
          />
        </div>
        <FormControl className={styles.splitSection}>
          <label htmlFor='warningThreshold'>
            <span className={styles.sectionTitle}>Warning Time</span>
            <span className={styles.sectionSubtitle}>The time (in minutes) when the color changes</span>
          </label>
          <InputGroup size='sm' width='140px'>
            <NumberInput
              {...numberInputProps}
              id='warningThreshold'
              variant='ontime-filled-on-light'
              value={millisToMinutes(Number(formData.warningThreshold), 'm')}
              onChange={(event) => handleThresholdChange('warningThreshold', event)}
            >
              <NumberInputField />
            </NumberInput>
            <InputRightAddon children='Minutes'></InputRightAddon>
          </InputGroup>
        </FormControl>
        <div className={styles.splitSection}>
          <div>
            <span className={`${styles.sectionTitle} ${styles.main}`}>Danger Color</span>
            <span className={styles.sectionSubtitle}>Change timer Danger Color</span>
          </div>
          <PopoverPicker
            name='dangerColor'
            color={formData.dangerColor}
            onChange={(event) => handleChange('dangerColor', event)}
          />
        </div>
        <FormControl className={styles.splitSection}>
          <label htmlFor='dangerThreshold'>
            <span className={styles.sectionTitle}>Danger Time</span>
            <span className={styles.sectionSubtitle}>The time (in minutes) when the color changes</span>
          </label>
          <InputGroup size='sm' width='140px'>
            <NumberInput
              {...numberInputProps}
              id='dangerThreshold'
              variant='ontime-filled-on-light'
              value={millisToMinutes(Number(formData.dangerThreshold), 'm')}
              onChange={(event) => handleThresholdChange('dangerThreshold', event)}
            >
              <NumberInputField />
            </NumberInput>
            <InputRightAddon children='Minutes'></InputRightAddon>
          </InputGroup>
        </FormControl>
        <div className={style.modalFields}>
          <SubmitContainer revert={revert} submitting={submitting} changed={changed} status={status} />
        </div>
      </ModalBody>
    </form>
  );
}
