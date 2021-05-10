import { IconButton } from '@chakra-ui/button';
import { useState } from 'react';
import { FiMinus } from 'react-icons/fi';

export default function DeleteIconBtn(props) {
  const { actionHandler, ...rest } = props;
  const [loading, setLoading] = useState(false);

  const handleClick = () => {
    setLoading(true);
    actionHandler('delete');
  };

  return (
    <IconButton
      size={props.size || 'xs'}
      icon={<FiMinus />}
      colorScheme='red'
      onClick={handleClick}
      _focus={{ boxShadow: 'none' }}
      disabled={loading}
      isLoading={loading}
      {...rest}
    />
  );
}
