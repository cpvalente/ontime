import {
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from '@chakra-ui/modal';
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

export default function SettingsModal(props) {
  const { data, status, isError } = useFetch(EVENT_TABLE, fetchEvent);
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    publicInfo: '',
    backstageInfo: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const { isOpen, onClose } = props;

  useEffect(() => {
    if (data == null) return;

    setFormData({
      title: data.title,
      url: data.url,
      publicInfo: data.publicInfo,
      backstageInfo: data.backstageInfo,
    });
  }, [data]);

  const submitHandler = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    await postEvent(formData).then(setSubmitting(false)).then(onClose);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      closeOnOverlayClick={false}
      motionPreset={'slideInBottom'}
    >
      <ModalOverlay />
      <ModalContent>
        <form onSubmit={submitHandler}>
          <ModalHeader>Event Main Info</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {status === 'success' && (
              <>
                <FormControl id='title'>
                  <FormLabel
                    style={{ fontWeight: 400, paddingTop: '1em' }}
                    htmlFor='title'
                  >
                    Event Title
                  </FormLabel>
                  <Input
                    size='sm'
                    name='title'
                    placeholder='Event Title'
                    autoComplete='off'
                    value={formData.title}
                    onChange={(event) =>
                      setFormData({ ...formData, title: event.target.value })
                    }
                    isDisabled={submitting}
                  />
                </FormControl>

                <FormControl id='url'>
                  <FormLabel
                    style={{ fontWeight: 400, paddingTop: '1em' }}
                    htmlFor='url'
                  >
                    Event URL
                  </FormLabel>
                  <Input
                    size='sm'
                    name='url'
                    placeholder='www.onsite.no'
                    autoComplete='off'
                    value={formData.url}
                    onChange={(event) =>
                      setFormData({ ...formData, url: event.target.value })
                    }
                    isDisabled={submitting}
                  />
                </FormControl>

                <FormControl id='pubInfo'>
                  <FormLabel
                    style={{ fontWeight: 400, paddingTop: '1em' }}
                    htmlFor='pubInfo'
                  >
                    Public Info
                  </FormLabel>
                  <Textarea
                    size='sm'
                    name='pubInfo'
                    placeholder='Information to be shown on public screens'
                    autoComplete='off'
                    value={formData.publicInfo}
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        publicInfo: event.target.value,
                      })
                    }
                    isDisabled={submitting}
                  />
                </FormControl>

                <FormControl id='backstageInfo'>
                  <FormLabel
                    style={{ fontWeight: 400, paddingTop: '1em' }}
                    htmlFor='backstageInfo'
                  >
                    Backstage Info
                  </FormLabel>
                  <Textarea
                    size='sm'
                    name='backstageInfo'
                    placeholder='Information to be shown on backstage screens'
                    autoComplete='off'
                    value={formData.backstageInfo}
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        backstageInfo: event.target.value,
                      })
                    }
                    isDisabled={submitting}
                  />
                </FormControl>
              </>
            )}
          </ModalBody>

          <ModalFooter>
            <Button
              colorScheme='blue'
              mr={3}
              isLoading={submitting}
              type='submit'
            >
              Save
            </Button>
            <Button variant='ghost' onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
