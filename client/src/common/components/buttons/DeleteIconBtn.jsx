import { IconButton } from '@chakra-ui/button';
import { useState } from 'react';
import { IoRemove } from '@react-icons/all-files/io5/IoRemove';
import { Tooltip } from '@chakra-ui/tooltip';

export default function DeleteIconBtn(props) {
  const { actionHandler, ...rest } = props;
  const [loading, setLoading] = useState(false);

  const handleClick = () => {
    setLoading(true);
    actionHandler('delete');
  };

  return (
    <Tooltip label='Delete'>
      <IconButton
        size={props.size || 'xs'}
        icon={<IoRemove />}
        colorScheme='red'
        onClick={handleClick}
        _focus={{ boxShadow: 'none' }}
        disabled={loading}
        isLoading={loading}
        {...rest}
      />
    </Tooltip>
  );
}
