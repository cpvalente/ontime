import { IconButton } from '@chakra-ui/button';
import { FormControl, FormLabel } from '@chakra-ui/form-control';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import { Input } from '@chakra-ui/input';
import { useContext } from 'react';
import { useState } from 'react';
import { PresenterMessagesContext } from '../../app/context/presenterMessageContext';

export default function MessageForm() {
  const [presenterShow, setPresenterShow] = useState(false);
  const [publicShow, setPublicShow] = useState(false);
  const [presMessage, setPresMessage] = useContext(PresenterMessagesContext);

  const handleSetPresenter = () => {
    setPresenterShow(!presenterShow);
    setPresMessage((prev) => ({ ...prev, show: !presMessage.show }));
  };

  const handlePresenterChange = (val) => {
    setPresMessage((prev) => ({ ...prev, text: val }));
  };

  const handleSetPublic = () => {
    setPublicShow(!publicShow);
  };

  const handlePublicChange = (val) => {};

  return (
    <>
      <form style={{ display: 'flex', gap: '1em', fontSize: '15px' }}>
        <FormControl id='presenterMessage'>
          <FormLabel>Presenter screen message</FormLabel>
          <Input
            placeholder='only the presenter screens see this'
            onChange={(event) => handlePresenterChange(event.target.value)}
          />
        </FormControl>
        <IconButton
          style={{ alignSelf: 'flex-end' }}
          colorScheme='teal'
          variant={presenterShow ? 'solid' : 'outline'}
          onClick={handleSetPresenter}
          icon={presenterShow ? <ViewOffIcon /> : <ViewIcon />}
        />
      </form>

      <form style={{ display: 'flex', gap: '1em', paddingTop: '1em' }}>
        <FormControl id='generalMessage'>
          <FormLabel>Public screen message</FormLabel>
          <Input
            placeholder='all screens will render this'
            onChange={(event) => handlePublicChange(event.target.value)}
          />
        </FormControl>
        <IconButton
          style={{ alignSelf: 'flex-end' }}
          colorScheme='teal'
          variant={publicShow ? 'solid' : 'outline'}
          onClick={handleSetPublic}
          icon={publicShow ? <ViewOffIcon /> : <ViewIcon />}
        />
      </form>
    </>
  );
}
