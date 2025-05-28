import { RefObject, useEffect } from 'react';
import { Textarea, TextareaProps } from '@chakra-ui/react';
// @ts-expect-error no types from library
import autosize from 'autosize/dist/autosize';

export const AutoTextArea = (props: TextareaProps & { inputref: RefObject<unknown> }) => {
  const { value, inputref } = props;

  useEffect(() => {
    const node = inputref.current;
    autosize(inputref.current);
    return () => {
      autosize.destroy(node);
    };
  }, [inputref, value]);

  return (
    <Textarea
      overflow='hidden'
      w='100%'
      ref={inputref}
      resize='none'
      transition='height none'
      variant='ontime-transparent'
      {...props}
    />
  );
};