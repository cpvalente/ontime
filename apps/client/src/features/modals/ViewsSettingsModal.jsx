import { useCallback, useEffect, useState } from 'react';
import { FormControl, FormLabel, Input, ModalBody } from '@chakra-ui/react';
import { IoInformationCircleOutline } from '@react-icons/all-files/io5/IoInformationCircleOutline';

import { postView } from '../../common/api/ontimeApi';
import EnableBtn from '../../common/components/buttons/EnableBtn';
import useViewSettings from '../../common/hooks-query/useViewSettings';
import { viewsSettingsPlaceholder } from '../../common/models/ViewSettings.type';
import { useEmitLog } from '../../common/stores/logger';
import { openLink } from '../../common/utils/linkUtils';
import { inputProps } from '../../features/modals/modalHelper';

import SubmitContainer from './SubmitContainer';

import style from './Modals.module.scss';

const customStylingDocsUrl = 'https://ontime.gitbook.io/v2/features/custom-styling';

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

  return (
    <ModalBody className={style.modalBody}>
      <p className={style.notes}>
        Options related to the viewers
        <br />
        🔥 Changes take effect immediately 🔥
      </p>
      <form onSubmit={submitHandler}>
        <div className={style.hSeparator}>Timer end message</div>
        <div className={style.spacedEntry}>
          <FormLabel htmlFor='endMessage'>
            End Message
            <span className={style.labelNote}>
              <br />
              Shown on presenter view when time is finished
            </span>
          </FormLabel>
          <Input
            {...inputProps}
            maxLength={50}
            name='endMessage'
            placeholder='Empty message shows elapsed time'
            value={formData.endMessage}
            onChange={(event) => handleChange('endMessage', event.target.value)}
          />
        </div>
        <div className={style.hSeparator}>Style Options</div>
        <div className={style.blockNotes}>
          <span className={style.inlineFlex}>
            <IoInformationCircleOutline color='#2b6cb0' fontSize='2em' />
            CSS Style Overrides
          </span>
          This feature allows user defined CSS to customise viewers appearance. <br />
          <a href='#!' onClick={() => openLink(customStylingDocsUrl)} className={style.if}>
            For details on the styling and file location please refer to documentation
          </a>
        </div>
        <div className={style.modalFields}>
          <div className={style.modalInline}>
            <FormControl>
              <FormLabel htmlFor='overrideStyles'>
                Override CSS Styles
                <span className={style.labelNote}>
                  <br />
                  Enable / Disable override
                </span>
              </FormLabel>
              <EnableBtn
                active={formData.overrideStyles}
                text={formData.overrideStyles ? 'Style Override Enabled' : 'Style Override Disabled'}
                actionHandler={() => handleChange('overrideStyles', !formData.overrideStyles)}
              />
            </FormControl>
          </div>
          <SubmitContainer revert={revert} submitting={submitting} changed={changed} status={status} />
        </div>
      </form>
    </ModalBody>
  );
}
