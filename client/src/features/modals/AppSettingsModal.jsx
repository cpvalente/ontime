import { ModalBody } from '@chakra-ui/modal';
import { Checkbox, FormControl, FormLabel, Input, PinInput, PinInputField } from '@chakra-ui/react';
import { getSettings, ontimePlaceholderSettings, postSettings } from 'app/api/ontimeApi';
import { useContext, useEffect, useState } from 'react';
import { useFetch } from 'app/hooks/useFetch';
import { APP_SETTINGS } from 'app/api/apiConstants';
import style from './Modals.module.scss';
import { LoggingContext } from '../../app/context/LoggingContext';
import { IconButton } from '@chakra-ui/button';
import { FiEye } from '@react-icons/all-files/fi/FiEye';
import SubmitContainer from './SubmitContainer';
import { inputProps } from './modalHelper';
import { LocalEventSettingsContext } from '../../app/context/LocalEventSettingsContext';

export default function AppSettingsModal() {
  const { data, status, refetch } = useFetch(APP_SETTINGS, getSettings);
  const { emitError, emitWarning } = useContext(LoggingContext);
  const [formData, setFormData] = useState(ontimePlaceholderSettings);
  const [changed, setChanged] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [hidePin, setHidePin] = useState(true);

  const {
    showQuickEntry,
    setShowQuickEntry,
    starTimeIsLastEnd,
    setStarTimeIsLastEnd,
    defaultPublic,
    setDefaultPublic,
  } = useContext(LocalEventSettingsContext);

  const [doShowQuickEntry, setDoShowQuickEntry] = useState(showQuickEntry);
  const [doStarTimeIsLastEnd, setDoStarTimeIsLastEnd] = useState(starTimeIsLastEnd);
  const [doDefaultPublic, setDoDefaultPublic] = useState(defaultPublic);

  /**
   * Set formdata from server state
   */
  useEffect(() => {
    if (data == null) return;
    if (changed) return;
    setFormData({
      pinCode: data.pinCode,
    });
  }, [changed, data]);

  /**
   * Set formdata from context
   */
  useEffect(() => {
    if (showQuickEntry == null) return;
    setDoShowQuickEntry(showQuickEntry);
  }, [showQuickEntry]);

  useEffect(() => {
    if (starTimeIsLastEnd == null) return;
    setDoStarTimeIsLastEnd(starTimeIsLastEnd);
  }, [starTimeIsLastEnd]);

  useEffect(() => {
    if (defaultPublic == null) return;
    setDoDefaultPublic(defaultPublic);
  }, [defaultPublic]);

  /**
   * Validate and submit data
   */
  const submitHandler = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    // set context
    setShowQuickEntry(doShowQuickEntry);
    setStarTimeIsLastEnd(doStarTimeIsLastEnd);
    setDefaultPublic(doDefaultPublic);

    const f = formData;

    // we might not have changed this
    if (f.pinCode !== data.pinCode) {
      let e = { status: false, message: '' };

      // Validate fields
      if (f.pinCode === '' || f.pinCode == null) {
        e.status = true;
        e.message += 'App pin code removed';
      } else {
        e.status = true;
        e.message += 'App pin code added';
      }

      // set fields with error
      if (!e.status) {
        emitError(`Invalid Input: ${e.message}`);
      } else {
        await postSettings(formData);
        await refetch();
        emitWarning(e.message);
        setChanged(false);
      }
    }
    setSubmitting(false);
    setChanged(false);
  };

  /**
   * Reverts local state equals to server state
   */
  const revert = async () => {
    setChanged(false);
    await refetch();

    // set from context
    setDoShowQuickEntry(showQuickEntry);
    setDoStarTimeIsLastEnd(starTimeIsLastEnd);
    setDoDefaultPublic(defaultPublic);
  };

  /**
   * Handles change of input field in local state
   * @param {string} field - object parameter to update
   * @param {string} value - new object parameter value
   */
  const handleChange = (field, value) => {
    const temp = { ...formData };
    temp[field] = value;
    setFormData(temp);
    setChanged(true);
  };

  /**
   * Sets changed flag to true
   */
  const handleContextChange = () => {
    setChanged(true);
  };

  const disableModal = status !== 'success';

  return (
    <ModalBody className={style.modalBody}>
      <p className={style.notes}>
        Options related to the application
        <br />
        🔥 Changes take effect on save 🔥
      </p>
      <form onSubmit={submitHandler}>
        <div className={style.modalFields}>
          <div className={style.hSeparator}>General App Settings</div>
          <div className={style.modalInline}>
            <FormControl id='serverPort'>
              <FormLabel htmlFor='serverPort'>
                Viewer Port
                <span className={style.labelNote}>
                  <br />
                  Ontime is available at port
                </span>
              </FormLabel>
              <Input
                {...inputProps}
                name='title'
                value={4001}
                disabled
                style={{ width: '6em', textAlign: 'center' }}
              />
            </FormControl>
            <FormControl id='editorPin'>
              <FormLabel htmlFor='editorPin'>
                Editor Pincode
                <span className={style.labelNote}>
                  <br />
                  Protect the editor with a Pincode
                </span>
              </FormLabel>
              <div className={style.pin}>
                <PinInput
                  {...inputProps}
                  type='alphanumeric'
                  defaultValue=''
                  value={formData.pinCode}
                  mask={hidePin}
                  isDisabled={disableModal}
                  onChange={(value) => handleChange('pinCode', value)}
                >
                  <PinInputField />
                  <PinInputField />
                  <PinInputField />
                  <PinInputField />
                </PinInput>
                <IconButton
                  size='sm'
                  colorScheme='blue'
                  variant='ghost'
                  icon={<FiEye />}
                  aria-label='Editor pin code'
                  onMouseDown={() => setHidePin(false)}
                  onMouseUp={() => setHidePin(true)}
                  isDisabled={disableModal}
                />
              </div>
            </FormControl>
          </div>
          <div className={style.hSeparator}>Create Event Default Settings</div>
          <div className={style.modalColumn}>
            <Checkbox
              isChecked={doShowQuickEntry}
              onChange={(e) => {
                setDoShowQuickEntry(e.target.checked);
                handleContextChange();
              }}
            >
              Show quick entry on hover
            </Checkbox>
            <Checkbox
              isChecked={doStarTimeIsLastEnd}
              onChange={(e) => {
                setDoStarTimeIsLastEnd(e.target.checked);
                handleContextChange();
              }}
            >
              Start time is last end
            </Checkbox>
            <Checkbox
              isChecked={doDefaultPublic}
              onChange={(e) => {
                setDoDefaultPublic(e.target.checked);
                handleContextChange();
              }}
            >
              Event default public
            </Checkbox>
          </div>
        </div>
        <SubmitContainer
          revert={revert}
          submitting={submitting}
          changed={changed}
          status={status}
        />
      </form>
    </ModalBody>
  );
}
