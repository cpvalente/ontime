import { useCallback, useEffect, useState } from 'react';
import {
  FormLabel,
  ModalBody,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
} from '@chakra-ui/react';

import { useEmitLog } from '@/common/stores/logger';

import { postView } from '../../common/api/ontimeApi';
import PopoverPicker from '../../common/components/input/color-picker-input/PopoverPicker';
import useViewSettings from '../../common/hooks-query/useViewSettings';
import { viewsSettingsPlaceholder } from '../../common/models/ViewSettings.type';
import { forgivingStringToMillis, millisToMinutes } from '../../common/utils/dateConfig';

import { numberInputProps } from './modalHelper';
import SubmitContainer from './SubmitContainer';

import style from './Modals.module.scss';

export default function StyleSettingsModal() {
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
        Options related to the timer styling
        <br />
        🔥 Changes take effect on save 🔥
      </p>
      <form onSubmit={submitHandler}>
        <div className={style.modalFields}>
          <div className={style.modalInline}>
            <div className={style.spacedEntry}>
              <FormLabel htmlFor='normalColor'> Normal Color </FormLabel>
              <PopoverPicker
                name='normalColor'
                color={formData.normalColor}
                onChange={(event) => handleChange('normalColor', event)}
              ></PopoverPicker>
            </div>
            <div className={style.spacedEntry}>
              <FormLabel htmlFor='warningColor'> Warning Color </FormLabel>
              <PopoverPicker
                name='warningColor'
                color={formData.warningColor}
                onChange={(event) => handleChange('warningColor', event)}
              ></PopoverPicker>
            </div>
            <div className={style.spacedEntry}>
              <FormLabel htmlFor='dangerColor'> Danger Color </FormLabel>
              <PopoverPicker
                name='dangerColor'
                color={formData.dangerColor}
                onChange={(event) => handleChange('dangerColor', event)}
              ></PopoverPicker>
            </div>
          </div>
          <div className={style.modalInline}>
            <div className={style.spacedEntry}>
              <FormLabel htmlFor='warningThreshold'>Warning Time</FormLabel>
              <NumberInput
                {...numberInputProps}
                value={millisToMinutes(Number(formData.warningThreshold), 'm')}
                onChange={(event) => handleThresholdChange('warningThreshold', Number(event))}
              >
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </div>
            <div className={style.spacedEntry}>
              <FormLabel htmlFor='dangerThreshold'>Danger Time</FormLabel>
              <NumberInput
                {...numberInputProps}
                value={millisToMinutes(Number(formData.dangerThreshold), 'm')}
                onChange={(event) => handleThresholdChange('dangerThreshold', Number(event))}
              >
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </div>
          </div>
          <SubmitContainer revert={revert} submitting={submitting} changed={changed} status={status} />
        </div>
      </form>
    </ModalBody>
  );
}
