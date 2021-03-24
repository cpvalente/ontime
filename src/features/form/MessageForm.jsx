import { IconButton } from '@chakra-ui/button';
import { FormControl, FormLabel } from '@chakra-ui/form-control';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import { Input } from '@chakra-ui/input';
import { useState } from 'react';

export default function MessageForm(props) {
  const [presenterShow, setPresenterShow] = useState(false);
  const [publicShow, setPublicShow] = useState(false);

  const handleSetPresenter = () => {
    setPresenterShow(!presenterShow);
  }

  const handleSetPublic = () => {
    setPublicShow(!publicShow);
  }

  return (
    <>
      <form style={{ display: 'flex', gap: '1em' }}>
        <FormControl id='presenterMessage'>
          <FormLabel>Presenter screen message</FormLabel>
          <Input placeholder='only the presenter screens see this' />
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
          <Input placeholder='all screens will render this' />
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
