import { ModalBody } from '@chakra-ui/modal';
import {
  FormLabel,
  FormControl,
  Input,
  Button,
  Textarea,
} from '@chakra-ui/react';
import { fetchEvent, postEvent } from 'app/api/eventApi';
import { useEffect, useState } from 'react';
import { useFetch } from 'app/hooks/useFetch';
import { EVENT_TABLE } from 'app/api/apiConstants';
import style from './Modals.module.css';

export default function SettingsModal() {
  const { data, status } = useFetch(EVENT_TABLE, fetchEvent);
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    publicInfo: '',
    backstageInfo: '',
    endMessage: '',
  });
  const [changed, setChanged] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (data == null) return;

    setFormData({
      title: data.title,
      url: data.url,
      publicInfo: data.publicInfo,
      backstageInfo: data.backstageInfo,
      endMessage: data.endMessage,
    });
  }, [data]);

  const submitHandler = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    await postEvent(formData);

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
                Options related to the running event
                <br />
                Affect rendered views
              </p>

              <FormControl id='title'>
                <FormLabel htmlFor='title'>Event Title</FormLabel>
                <Input
                  size='sm'
                  maxLength={35}
                  name='title'
                  placeholder='Event Title'
                  autoComplete='off'
                  value={formData.title}
                  onChange={(event) => {
                    setChanged(true);
                    setFormData({ ...formData, title: event.target.value });
                  }}
                  isDisabled={submitting}
                />
              </FormControl>

              <FormControl id='url'>
                <FormLabel htmlFor='url'>
                  Event URL
                  <span className={style.notes}>
                    (shown as a QR code in some views)
                  </span>
                </FormLabel>
                <Input
                  size='sm'
                  name='url'
                  placeholder='www.onsite.no'
                  autoComplete='off'
                  value={formData.url}
                  onChange={(event) => {
                    setChanged(true);
                    setFormData({ ...formData, url: event.target.value });
                  }}
                  isDisabled={submitting}
                />
              </FormControl>

              <FormControl id='pubInfo'>
                <FormLabel htmlFor='pubInfo'>Public Info</FormLabel>
                <Textarea
                  size='sm'
                  name='pubInfo'
                  placeholder='Information to be shown on public screens'
                  autoComplete='off'
                  value={formData.publicInfo}
                  onChange={(event) => {
                    setChanged(true);
                    setFormData({
                      ...formData,
                      publicInfo: event.target.value,
                    });
                  }}
                  isDisabled={submitting}
                />
              </FormControl>

              <FormControl id='backstageInfo'>
                <FormLabel htmlFor='backstageInfo'>Backstage Info</FormLabel>
                <Textarea
                  size='sm'
                  name='backstageInfo'
                  placeholder='Information to be shown on backstage screens'
                  autoComplete='off'
                  value={formData.backstageInfo}
                  onChange={(event) => {
                    setChanged(true);
                    setFormData({
                      ...formData,
                      backstageInfo: event.target.value,
                    });
                  }}
                  isDisabled={submitting}
                />
              </FormControl>

              <FormControl id='endMessage'>
                <FormLabel htmlFor='endMessage'>
                  End Message
                  <span className={style.notes}>
                    Shown on presenter view when time is finished
                  </span>
                </FormLabel>
                <Input
                  size='sm'
                  maxLength={30}
                  name='endMessage'
                  placeholder='Empty message shows elapsed time'
                  autoComplete='off'
                  value={formData.endMessage}
                  onChange={(event) => {
                    setChanged(true);
                    setFormData({
                      ...formData,
                      endMessage: event.target.value,
                    });
                  }}
                  isDisabled={submitting}
                />
              </FormControl>
            </>
          )}
          <Button
            colorScheme='blue'
            type='submit'
            isLoading={submitting}
            disabled={!changed}
          >
            Save
          </Button>
        </ModalBody>
      </form>
    </>
  );
}
