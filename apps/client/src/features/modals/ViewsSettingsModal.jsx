import { useCallback, useEffect, useState } from 'react';
import {
  FormControl,
  ModalBody,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Switch,
} from '@chakra-ui/react';
import { IoCheckmarkSharp } from '@react-icons/all-files/io5/IoCheckmarkSharp';
import { IoInformationCircleOutline } from '@react-icons/all-files/io5/IoInformationCircleOutline';

import { useEmitLog } from '@/common/stores/logger';

import { postView } from '../../common/api/ontimeApi';
import PopoverPicker from '../../common/components/input/color-picker-input/PopoverPicker';
import useViewSettings from '../../common/hooks-query/useViewSettings';
import { viewsSettingsPlaceholder } from '../../common/models/ViewSettings.type';
import { forgivingStringToMillis, millisToMinutes } from '../../common/utils/dateConfig';
import { openLink } from '../../common/utils/linkUtils';

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

  return (
    <ModalBody className={style.modalBody}>
      <p className={style.notes}>
        Options related to the viewers
        <br />
        🔥 Changes take effect on Save 🔥
      </p>
      <form onSubmit={submitHandler}>
        <div className={style.hSeparator}>Style Options</div>
        {/* <div className={style.blockNotes}>
          <span className={style.inlineFlex}>
            <IoInformationCircleOutline color='#2b6cb0' fontSize='2em' />
            CSS Style Overrides
          </span>
          This feature allows user defined CSS to override the application stylesheets as a way to customise viewers
          appearance.
          <br />
          Currently the feature affects the following views
          <br />
          <ul className={style.featureList}>
            <li>
              <IoCheckmarkSharp /> Stage timer
            </li>
            <li>
              <IoCheckmarkSharp /> Clock
            </li>
            <li>
              <IoCheckmarkSharp /> Minimal timer
            </li>
            <li>
              <IoCheckmarkSharp /> Backstage screen
            </li>
            <li>
              <IoCheckmarkSharp /> Public screen
            </li>
            <li>
              <IoCheckmarkSharp /> Countdown
            </li>
          </ul>
          Read more about it in the documentation{' '}
          <a
            href='#!'
            onClick={() => openLink('https://cpvalente.gitbook.io/ontime/features/custom-styling')}
            className={style.if}
          >
            over at Gitbook
          </a>
        </div> */}
        <div className={styles.splitSection}>
          <div>
            <span className={`${styles.sectionTitle} ${styles.main}`}>Override CSS Styles</span>
            <span className={styles.sectionSubtitle}>Enable / Disable override</span>
          </div>
          <Switch onChange={() => handleChange('overrideStyles', !formData.overrideStyles)} variant='ontime-on-light' />
        </div>
        <hr className={styles.divider} />
        <div className={styles.splitSection}>
          <div>
            <span className={`${styles.sectionTitle} ${styles.main}`}>Normal Color</span>
            <span className={styles.sectionSubtitle}>Change timer Normal Color</span>
          </div>
          <PopoverPicker
            name='normalColor'
            color={formData.normalColor}
            onChange={(event) => handleChange('normalColor', event)}
          ></PopoverPicker>
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
          ></PopoverPicker>
        </div>
        <FormControl className={styles.splitSection}>
          <label htmlFor='warningThreshold'>
            <span className={styles.sectionTitle}>Warning Time</span>
            <span className={styles.sectionSubtitle}>The time when the color changes</span>
          </label>
          <NumberInput
            {...numberInputProps}
            id='warningThreshold'
            variant='ontime-filled-on-light'
            value={millisToMinutes(Number(formData.warningThreshold), 'm')}
            onChange={(event) => handleThresholdChange('warningThreshold', Number(event))}
          >
            <NumberInputField />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
        </FormControl>
        <hr className={styles.divider} />
        <div className={styles.splitSection}>
          <div>
            <span className={`${styles.sectionTitle} ${styles.main}`}>Danger Color</span>
            <span className={styles.sectionSubtitle}>Change timer Danger Color</span>
          </div>
          <PopoverPicker
            name='dangerColor'
            color={formData.dangerColor}
            onChange={(event) => handleChange('dangerColor', event)}
          ></PopoverPicker>
        </div>
        <FormControl className={styles.splitSection}>
          <label htmlFor='dangerThreshold'>
            <span className={styles.sectionTitle}>Danger Time</span>
            <span className={styles.sectionSubtitle}>The time when the color changes</span>
          </label>
          <NumberInput
            {...numberInputProps}
            id='dangerThreshold'
            variant='ontime-filled-on-light'
            value={millisToMinutes(Number(formData.dangerThreshold), 'm')}
            onChange={(event) => handleThresholdChange('dangerThreshold', Number(event))}
          >
            <NumberInputField />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
        </FormControl>
        <div className={style.modalFields}>
          <SubmitContainer revert={revert} submitting={submitting} changed={changed} status={status} />
        </div>
      </form>
    </ModalBody>
  );
}
