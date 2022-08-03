import React, { useEffect, useRef } from 'react';
import { Textarea } from '@chakra-ui/react';
import autosize from 'autosize/dist/autosize';

export const AutoTextArea = (props) => {
  const ref = useRef();

  useEffect(() => {
    const node = ref.current;
    autosize(ref.current);
    return () => {
      autosize.destroy(node);
    };
  }, []);


  return (
    <Textarea
      overflow='hidden'
      w='100%'
      resize='none'
      ref={ref}
      transition='height none'
      {...props}
    />
  );
};
