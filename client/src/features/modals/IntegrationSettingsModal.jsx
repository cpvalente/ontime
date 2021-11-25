import { ModalBody } from '@chakra-ui/modal';
import {
  FormLabel,
  FormControl,
  Input,
  Button,
  Switch,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionIcon,
  AccordionPanel,
  Box,
} from '@chakra-ui/react';
import { getInfo, ontimePlaceholderInfo, postInfo } from 'app/api/ontimeApi';
import { useEffect, useState } from 'react';
import { useFetch } from 'app/hooks/useFetch';
import { APP_TABLE } from 'app/api/apiConstants';
import { showErrorToast } from 'common/helpers/toastManager';
import style from './Modals.module.scss';

export default function IntegrationSettingsModal() {
  const { data, status } = useFetch(APP_TABLE, getInfo);
  const [formData, setFormData] = useState(ontimePlaceholderInfo);
  const [changed, setChanged] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (data == null) return;

    setFormData({
      oscInPort: data.oscInPort,
      oscOutPort: data.oscOutPort,
      oscOutIP: data.oscOutIP,
    });
  }, [data]);

  const submitHandler = async (event) => {
    event.preventDefault();

    const f = formData;
    let e = { status: false, message: '' };

    // Validate fields
    if (f.oscInPort < 1024 || f.oscInPort > 65535) {
      // Port in incorrect range
      e.status = true;
      e.message += 'OSC IN Port in incorrect range (1024 - 65535)';
    } else if (f.oscOutPort < 1024 || f.oscOutPort > 65535) {
      // Port in incorrect range
      e.status = true;
      e.message += 'OSC OUT Port in incorrect range (1024 - 65535)';
    } else if (f.oscInPort === f.oscOutPort) {
      // Cant use the same port
      e.status = true;
      e.message += 'OSC IN and OUT Ports cant be the same';
    }

    // set fields with error
    if (e.status) {
      showErrorToast('Invalid Input', e.message);
      return;
    }

    // Post here
    postInfo(formData);

    setChanged(false);
    setSubmitting(false);
  };

  return (
    <>
      <form onSubmit={submitHandler}>
        <ModalBody className={style.modalBody}>
          {status === 'success' && (
            <>
              <p className={style.notes}>
                Integrate with with third party over an HTTP API
                <br />
                🔥 Changes take effect after app restart 🔥
              </p>
              <div className={style.modalInline}>
                <FormControl id='targetIp' width='auto'>
                  <FormLabel htmlFor='targetIp'>Target IP Address</FormLabel>
                  <Input
                    size='sm'
                    name='targetIp'
                    placeholder='127.0.0.1'
                    autoComplete='off'
                    value={formData.oscOutIP}
                    onChange={(event) => {
                      setChanged(true);
                      setFormData({
                        ...formData,
                        oscOutIP: event.target.value,
                      });
                    }}
                    isDisabled={submitting}
                    style={{ width: '10em', textAlign: 'right' }}
                  />
                </FormControl>
                <FormControl id='targetPort'>
                  <FormLabel htmlFor='targetPort'>
                    Target Port
                    <span className={style.notes}>Default 8088</span>
                  </FormLabel>
                  <Input
                    size='sm'
                    name='targetPort'
                    placeholder='8088'
                    autoComplete='off'
                    type='number'
                    value={formData.oscInPort}
                    min='1024'
                    max='65535'
                    onChange={(event) => {
                      setChanged(true);
                      setFormData({
                        ...formData,
                        oscInPort: parseInt(event.target.value),
                      });
                    }}
                    isDisabled={submitting}
                    style={{ width: '5em', textAlign: 'center' }}
                  />
                </FormControl>

                <FormControl id='enable' width='auto'>
                  <FormLabel htmlFor='enable'>Enable</FormLabel>
                  <Switch id='enable' />
                </FormControl>
              </div>
              <Accordion allowToggle>
                <AccordionItem>
                  <h2>
                    <AccordionButton>
                      <Box flex='1' textAlign='left'>
                        Help
                      </Box>
                      <AccordionIcon />
                    </AccordionButton>
                  </h2>
                  <AccordionPanel pb={4} className={style.highNotes}>
                    <p>
                      Add HTTP messages that ontime will send during the app
                      lifecycle
                    </p>
                    <p>
                      You can also use the variables below, inline with the
                      defined URL, to pass data directly from ontime
                    </p>
                    <table>
                      <tr>
                        <td className={style.noteItem}>$timer</td>
                        <td>Current running timer</td>
                      </tr>
                      <tr>
                        <td className={style.noteItem}>$title</td>
                        <td>Current title</td>
                      </tr>
                      <tr>
                        <td className={style.noteItem}>$presenter</td>
                        <td>Current presenter</td>
                      </tr>
                      <tr>
                        <td className={style.noteItem}>$subtitle</td>
                        <td>Current subtitle</td>
                      </tr>
                      <tr>
                        <td className={style.noteItem}>$next-title</td>
                        <td>Next title</td>
                      </tr>
                      <tr>
                        <td className={style.noteItem}>$next-presenter</td>
                        <td>Next presenter</td>
                      </tr>
                      <tr>
                        <td className={style.noteItem}>$next-subtitle</td>
                        <td>Next subtitle</td>
                      </tr>
                    </table>
                  </AccordionPanel>
                </AccordionItem>
              </Accordion>

              <h2>Ontime Lifecycle</h2>
              <Accordion allowToggle>
                <AccordionItem>
                  <h2>
                    <AccordionButton>
                      <Box flex='1' textAlign='left'>
                        On Load
                        <span className={style.notes}>
                          When a new event loads
                        </span>
                      </Box>
                      <AccordionIcon />
                    </AccordionButton>
                  </h2>
                  <AccordionPanel pb={4}>
                    <div className={style.highNotes}>
                      <p className={style.flexNote}>s</p>
                    </div>
                  </AccordionPanel>
                </AccordionItem>
                <AccordionItem>
                  <h2>
                    <AccordionButton>
                      <Box flex='1' textAlign='left'>
                        On Start
                        <span className={style.notes}>
                          When an timer starts / resumes
                        </span>
                      </Box>
                      <AccordionIcon />
                    </AccordionButton>
                  </h2>
                  <AccordionPanel pb={4}>
                    <div className={style.highNotes}>
                      <p className={style.flexNote}>s</p>
                    </div>
                  </AccordionPanel>
                </AccordionItem>
                <AccordionItem>
                  <h2>
                    <AccordionButton>
                      <Box flex='1' textAlign='left'>
                        On Update
                        <span className={style.notes}>At every clock tick</span>
                      </Box>
                      <AccordionIcon />
                    </AccordionButton>
                  </h2>
                  <AccordionPanel pb={4}>
                    <div className={style.highNotes}>
                      <p className={style.flexNote}>s</p>
                    </div>
                  </AccordionPanel>
                </AccordionItem>
                <AccordionItem>
                  <h2>
                    <AccordionButton>
                      <Box flex='1' textAlign='left'>
                        On Pause
                        <span className={style.notes}>When a timer pauses</span>
                      </Box>
                      <AccordionIcon />
                    </AccordionButton>
                  </h2>
                  <AccordionPanel pb={4}>
                    <div className={style.highNotes}>
                      <p className={style.flexNote}>s</p>
                    </div>
                  </AccordionPanel>
                </AccordionItem>
                <AccordionItem>
                  <h2>
                    <AccordionButton>
                      <Box flex='1' textAlign='left'>
                        On Stop
                        <span className={style.notes}>
                          When an event is unloaded
                        </span>
                      </Box>
                      <AccordionIcon />
                    </AccordionButton>
                  </h2>
                  <AccordionPanel pb={4}>
                    <div className={style.highNotes}>
                      <p className={style.flexNote}>s</p>
                    </div>
                  </AccordionPanel>
                </AccordionItem>
              </Accordion>
            </>
          )}
          <div className={style.submitContainer}>
            <Button
              colorScheme='blue'
              type='submit'
              isLoading={submitting}
              disabled={!changed}
            >
              Save
            </Button>
          </div>
        </ModalBody>
      </form>
    </>
  );
}
